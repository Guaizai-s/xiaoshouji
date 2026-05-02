<template>
  <div class="wx-page wx-chat-page" @click="onPageClick">
    <nav-bar :title="isTyping ? '对方正在输入…' : (role?.name || '聊天')" :show-back="true" :show-heart="true" action="•••" @action="goDetails" @heart="onHeart" />

    <div ref="messagesContainer" class="wx-content" :style="chatBackgroundStyle">
      <div v-if="messages.length === 0 && !isLoading" class="wx-empty">
        <div class="wx-empty-text">暂无消息</div>
        <div class="wx-empty-text">发送第一条消息开始对话</div>
      </div>

      <div v-else class="wx-messages">
        <div v-if="hasMore" class="load-more-wrapper">
          <button
            class="load-more-btn"
            :class="{ 'is-loading': isLoadingMore }"
            :disabled="isLoadingMore"
            @click="handleLoadMore"
          >
            <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span class="btn-text">{{ isLoadingMore ? '加载中...' : '查看更早的消息' }}</span>
          </button>
        </div>
        <template v-for="(message, index) in messages" :key="message.id">
          <div v-if="shouldShowTime(index)" class="wx-time-label">{{ formatMessageTime(message.timestamp) }}</div>
          <message-bubble
            :message="message"
            :user-avatar="userAvatar"
            :role-avatar="role?.avatar || defaultAvatar"
            :linked-stickers="linkedStickers"
            @delete="deleteMessage"
            @claim-wallet="claimWalletMessage"
            @refund-transfer="refundTransferMessage"
          />
        </template>
      </div>
    </div>

    <chat-input
      ref="chatInputRef"
      :wallet-balance-cents="walletBalanceCents"
      @send="sendTextMessage"
      @send-image="sendImageMessage"
      @send-wallet="sendWalletMessage"
      @generate="generateReply"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ChatInput from '../components/ChatInput.vue';
import { conversationService, messageService, roleService, apiProfileService, personaService, stickerService, assetService, walletService, parseAmountToCents } from '../services/db';
import { callClaude } from '../services/claude';
import { textToSpeech } from '../services/minimax';
import { buildTimeContextPrompt } from '../utils/timeContext';

const route = useRoute();
const router = useRouter();
const conversationId = parseInt(route.params.id);

const goDetails = () => { router.push(`/chat-details/conv/${conversationId}`); };

const onHeart = () => {
  // 占位：后期用于展示角色心声
  alert('角色心声功能即将上线');
};

const conversation = ref(null);
const role = ref(null);
const allMessages = ref([]);
const displayOffset = ref(0);
const PAGE_SIZE = 30;
let messagesPaginated = false;

const messages = computed(() => allMessages.value.slice(displayOffset.value));

const shouldShowTime = (index) => {
  const all = allMessages.value.slice(displayOffset.value);
  if (index === 0) return true;
  return (all[index].timestamp - all[index - 1].timestamp) > 5 * 60 * 1000;
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return isToday ? `${h}:${m}` : `${date.getMonth()+1}月${date.getDate()}日 ${h}:${m}`;
};
const hasMore = computed(() => displayOffset.value > 0);
const isTyping = ref(false);
const isLoading = ref(true);
const messagesContainer = ref(null);
const linkedStickers = ref([]);
const walletBalanceCents = ref(0);

const defaultUserAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%2307C160" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white"%3E我%3C/text%3E%3C/svg%3E';
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23ddd" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20"%3E🤖%3C/text%3E%3C/svg%3E';

// 从localStorage读取用户头像
const userAvatar = ref(defaultUserAvatar);
const loadUserAvatar = () => {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      userAvatar.value = data.avatar || defaultUserAvatar;
    } catch (error) {
      console.error('读取用户头像失败', error);
    }
  }
};

const chatBackgroundStyle = computed(() => {
  const bg = role.value?.chatSettings?.chatBackground;
  if (!bg) return {};

  // 检测是否是夜间模式
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (isDark) {
    // 夜间模式：在背景图上添加半透明黑色遮罩
    return {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' };
});

onMounted(async () => {
  loadUserAvatar();
  await loadConversation();
  await loadWalletBalance();
  await loadMessages();
  scrollToBottom();
});

const lastMessageId = computed(() => {
  const msgs = messages.value;
  return msgs.length > 0 ? msgs[msgs.length - 1].id : null;
});

watch(lastMessageId, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

const loadConversation = async () => {
  conversation.value = await conversationService.getById(conversationId);
  role.value = await roleService.getById(conversation.value.roleId);

  console.log('1. 原始角色数据:', JSON.parse(JSON.stringify(role.value)));

  // 如果角色关联了API方案，获取配置并合并到role对象
  if (role.value?.apiProfileId) {
    const apiProfile = await apiProfileService.getById(role.value.apiProfileId);
    console.log('2. 加载的API方案:', JSON.parse(JSON.stringify(apiProfile)));

    if (apiProfile) {
      role.value = {
        ...role.value,
        apiKey: apiProfile.apiKey,
        baseUrl: apiProfile.baseUrl,
        model: apiProfile.model,
        apiFormat: apiProfile.apiFormat
      };
      console.log('3. 合并后的role.apiKey:', role.value.apiKey);
      console.log('3. 合并后的role.baseUrl:', role.value.baseUrl);
      console.log('3. 合并后的role.model:', role.value.model);
      console.log('3. 合并后的role.apiFormat:', role.value.apiFormat);
    } else {
      console.error('❌ 未找到API方案，ID:', role.value.apiProfileId);
    }
  } else {
    // 使用全局默认配置：选择第一个API方案
    console.warn('角色未关联API方案，尝试使用默认方案');
    const allProfiles = await apiProfileService.getAll();
    if (allProfiles.length > 0) {
      const defaultProfile = allProfiles[0];
      console.log('2. 使用默认API方案:', JSON.parse(JSON.stringify(defaultProfile)));
      role.value = {
        ...role.value,
        apiKey: defaultProfile.apiKey,
        baseUrl: defaultProfile.baseUrl,
        model: defaultProfile.model,
        apiFormat: defaultProfile.apiFormat
      };
      console.log('✅ 已自动使用第一个API方案:', defaultProfile.name);
    } else {
      console.error('❌ 没有可用的API方案，请先在设置中创建API方案');
    }
  }

  console.log('4. 最终role配置:', JSON.parse(JSON.stringify(role.value)));

  // 加载关联的表情包
  const settings = role.value?.chatSettings || {};
  if (settings.linkedLibraryId) {
    linkedStickers.value = await stickerService.getByLibrary(settings.linkedLibraryId);
  }

  // 标记为已读
  await conversationService.markAsRead(conversationId);
};

const loadMessages = async () => {
  allMessages.value = await messageService.getByConversation(conversationId);
  for (const message of allMessages.value) {
    if (message.type === 'redpacket' || message.type === 'transfer') {
      await walletService.syncMessageContent(message.id);
    }
  }
  allMessages.value = await messageService.getByConversation(conversationId);
  if (!messagesPaginated) {
    displayOffset.value = Math.max(0, allMessages.value.length - PAGE_SIZE);
    messagesPaginated = true;
  }
  isLoading.value = false;
};

const loadWalletBalance = async () => {
  walletBalanceCents.value = await walletService.getUserBalance();
};

const loadMore = async () => {
  const container = messagesContainer.value;
  const scrollHeightBefore = container.scrollHeight;
  displayOffset.value = Math.max(0, displayOffset.value - PAGE_SIZE);
  await nextTick();
  container.scrollTop += container.scrollHeight - scrollHeightBefore;
};

const isLoadingMore = ref(false);

const handleLoadMore = async () => {
  if (isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    await loadMore();
  } finally {
    isLoadingMore.value = false;
  }
};

const chatInputRef = ref(null);

const onPageClick = (e) => {
  if (!e.target.closest('.wx-input-bar') && !e.target.closest('.action-panel')) {
    document.activeElement?.blur();
    if (chatInputRef.value) {
      chatInputRef.value.closeActionSheet();
    }
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const deleteMessage = async (id) => {
  await messageService.delete(id);
  await loadMessages();
};

const sendTextMessage = async (text) => {
  try {
    await messageService.create(conversationId, 'user', text, 'text');
    await loadMessages();
  } catch (error) {
    alert('发送失败: ' + error.message);
  }
};

const sendWalletMessage = async ({ type, amount, note }) => {
  try {
    const amountCents = parseAmountToCents(amount);
    await walletService.createOutgoing({
      conversationId,
      roleId: role.value.id,
      type,
      amountCents,
      note
    });
    chatInputRef.value?.closeActionSheet();
    await loadWalletBalance();
    await loadMessages();
    scrollToBottom();
  } catch (error) {
    alert('发送失败: ' + error.message);
  }
};

const claimWalletMessage = async (messageId) => {
  try {
    await walletService.claim(messageId);
    await loadWalletBalance();
    await loadMessages();
  } catch (error) {
    alert(error.message);
  }
};

const refundTransferMessage = async (messageId) => {
  try {
    await walletService.refund(messageId);
    await loadMessages();
  } catch (error) {
    alert(error.message);
  }
};

const WALLET_COMMAND_RE = /\[(红包|转账)[:：]([0-9]+(?:\.[0-9]{1,2})?)(?:[:：]([^\]]*))?\]/;

const splitWalletCommand = (text) => {
  const match = text.match(WALLET_COMMAND_RE);
  if (!match) return null;
  return {
    before: text.slice(0, match.index).trim(),
    after: text.slice(match.index + match[0].length).trim(),
    type: match[1] === '红包' ? 'redpacket' : 'transfer',
    amountCents: parseAmountToCents(match[2]),
    note: (match[3] || '').trim()
  };
};

const createAssistantTextMessages = async (text) => {
  const clean = (text || '').trim();
  if (!clean) return;
  const parts = clean.split('\n').filter(p => p.trim());
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) await sleep(500);
    await messageService.create(conversationId, 'assistant', parts[i], 'text', null);
    await loadMessages();
  }
};

const createAssistantWalletSequence = async (text) => {
  const parsed = splitWalletCommand(text);
  if (!parsed) {
    await createAssistantTextMessages(text);
    return;
  }

  await createAssistantTextMessages(parsed.before);
  await walletService.createIncoming({
    conversationId,
    roleId: role.value.id,
    type: parsed.type,
    amountCents: parsed.amountCents,
    note: parsed.note
  });
  await loadMessages();
  await createAssistantTextMessages(parsed.after);
};

const generateReply = async () => {
  try {
    isTyping.value = true;
    const startTime = Date.now();

    const contextLength = role.value?.chatSettings?.contextLength || 15;
    const contextMessages = await messageService.getCombinedContext(role.value.id, contextLength);

    // 找到上下文中最后一条图片消息的索引（该条发真实图像，其余用占位符）
    let lastImageIndex = -1;
    for (let i = contextMessages.length - 1; i >= 0; i--) {
      if (contextMessages[i].type === 'image') { lastImageIndex = i; break; }
    }
    const apiFormat = role.value?.apiFormat || 'openai';

    const apiMessages = await Promise.all(contextMessages.map(async (msg, index) => {
      if (msg.type === 'image') {
        if (index === lastImageIndex) {
          const content = msg.content || '';
          const match = content.match(/^\[IMAGE:(.+)\]$/);
          const dataUrl = match
            ? await assetService.get(match[1])
            : content.startsWith('data:') ? content : null;
          if (dataUrl) {
            const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
            const base64 = dataUrl.split(',')[1];
            if (apiFormat === 'anthropic') {
              return { role: msg.role, content: [{ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }] };
            } else {
              return { role: msg.role, content: [{ type: 'image_url', image_url: { url: dataUrl } }] };
            }
          }
        }
        return { role: msg.role, content: '[图片]' };
      }
      if (msg.audioUrl && msg.content) {
        return { role: msg.role, content: `[语音:${msg.content}]` };
      }
      return { role: msg.role, content: msg.content };
    }));

    // 构建增强的系统提示词
    let enhancedPrompt = role.value.systemPrompt || '';

    // 添加时间感知
    const isRealTimeOn = role.value?.chatSettings?.isRealTimeOn;
    console.log('时间感知开关状态:', isRealTimeOn);
    console.log('完整chatSettings:', role.value?.chatSettings);

    if (isRealTimeOn) {
      enhancedPrompt = `${buildTimeContextPrompt(contextMessages)}\n\n${enhancedPrompt}`;
      console.log('Time context metadata added without modifying message content.');
    } else {
      console.log('❌ 时间感知未开启');
    }

    // 添加用户人设信息
    const settings = role.value?.chatSettings || {};
    if (settings.selectedPersonaId) {
      const persona = await personaService.getById(settings.selectedPersonaId);
      if (persona) {
        const userStatus = localStorage.getItem('userStatus') || '';
        enhancedPrompt += `\n\n[用户信息]\n${persona.description}`;
        if (userStatus) enhancedPrompt += `\n\n[用户状态]\n${userStatus}`;
      }
    }

    // 添加表情包信息
    if (settings.linkedLibraryId) {
      const linkedStickers = await stickerService.getByLibrary(settings.linkedLibraryId);
      const stickerList = linkedStickers.map(s => `${s.name}:${s.description}`).join('、');
      if (stickerList) {
        enhancedPrompt += `\n\n[可用表情包]\n你可以使用以下表情包，使用格式为[表情:名字]:\n${stickerList}`;
      }
    }

    let roleWithTime = { ...role.value, systemPrompt: enhancedPrompt };

    // 流式回调：收到一个换行就创建一个气泡
    const useStream = false;
    let audioUrl = null;
    let fullResponse = '';

    const response = await callClaude(roleWithTime, apiMessages, useStream ? async (chunk) => {
      fullResponse += chunk;
      // 移除语音标记
      const cleanChunk = chunk.replace(/\[语音[:：][^\]]+\]/g, '').trim();
      if (cleanChunk) {
        await messageService.create(conversationId, 'assistant', cleanChunk, 'text');
        await loadMessages();
      }
    } : null);

    const elapsed = Date.now() - startTime;
    if (elapsed < 800) await sleep(800 - elapsed);

    // 流式模式：检测完整响应中的语音标记
    if (useStream && fullResponse) {
      const voiceMatch = fullResponse.match(/\[语音[:：]([^\]]+)\]/);
      if (voiceMatch) {
        try {
          const voiceText = voiceMatch[1].trim();
          const voiceSettings = role.value?.chatSettings || {};
          audioUrl = await textToSpeech(voiceText, {
            voiceId: voiceSettings.minimaxVoiceId,
            model: voiceSettings.minimaxModel,
            speed: voiceSettings.minimaxSpeed,
            pitch: voiceSettings.minimaxPitch
          });
          // 删除流式创建的所有文字气泡，重建一条带audioUrl的消息
          const msgs = await messageService.getByConversation(conversationId);
          const streamMsgs = msgs.filter(m => m.role === 'assistant');
          for (const m of streamMsgs) await messageService.delete(m.id);
          await messageService.create(conversationId, 'assistant', voiceText, 'text', audioUrl);
          await loadMessages();
        } catch (error) {
          console.warn('语音生成失败:', error.message);
        }
      }
    }

    // 非流式模式：按原逻辑处理
    if (!useStream) {
      // 检测语音标记 [语音:文本内容]
      const voiceMatch = response.match(/\[语音[:：]([^\]]+)\]/);
      const voiceText = voiceMatch ? voiceMatch[1].trim() : '';

      if (voiceMatch) {
        try {
          const voiceSettings = role.value?.chatSettings || {};
          audioUrl = await textToSpeech(voiceText, {
            voiceId: voiceSettings.minimaxVoiceId,
            model: voiceSettings.minimaxModel,
            speed: voiceSettings.minimaxSpeed,
            pitch: voiceSettings.minimaxPitch
          });
        } catch (error) {
          console.warn('语音生成失败:', error.message);
        }
      }

      if (voiceMatch) {
        // 语音回复：只创建一条带audioUrl的消息
        if (voiceText || audioUrl) {
          await messageService.create(conversationId, 'assistant', voiceText, 'text', audioUrl);
          await loadMessages();
        }
      } else {
        // 纯文字回复：移除语音标记，按换行拆分
        const cleanResponse = response.replace(/\[语音[:：][^\]]+\]/g, '').trim();
        if (cleanResponse) {
          await createAssistantWalletSequence(cleanResponse);
        }
      }
    }

    isTyping.value = false;
  } catch (error) {
    isTyping.value = false;
    alert('生成失败: ' + error.message);
  }
};

const sendImageMessage = async (file, useOriginal) => {
  try {
    const dataUrl = useOriginal
      ? await compressImage(file, 2048, 0.95)
      : await compressImage(file, 384, 0.8);

    const imageKey = `img_${Date.now()}`;
    await assetService.set(imageKey, dataUrl);
    await messageService.create(conversationId, 'user', `[IMAGE:${imageKey}]`, 'image');
    await loadMessages();
  } catch (error) {
    alert('图片发送失败: ' + error.message);
  }
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 压缩图片：双边限制 + 统一输出 JPEG（PNG 的 quality 参数无效，转 JPEG 才能真正压缩）
const compressImage = (file, maxSize = 384, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
</script>

<style scoped>
.wx-chat-page {
  --chat-navbar-height: 44px;
  --chat-input-height: 56px;

  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--wx-bg);
}

.wx-time-label {
  text-align: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
  margin: 8px 0;
  pointer-events: none;
}

.wx-chat-page :deep(.wx-navbar-wrap) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
  background: var(--wx-white);
}

.wx-content {
  position: absolute;
  top: calc(var(--chat-navbar-height) + env(safe-area-inset-top));
  left: 0;
  right: 0;
  bottom: calc(var(--chat-input-height) + env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 0;
  padding-bottom: 16px;
  background-color: var(--wx-bg);
}
.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 18px;
  background-color: #f2f2f7;
  color: #8e8e93;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:active:not(:disabled) {
  background-color: #e5e5ea;
  transform: scale(0.96);
}

.load-more-btn:disabled {
  cursor: not-allowed;
}

.loading-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.load-more-btn.is-loading .loading-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
