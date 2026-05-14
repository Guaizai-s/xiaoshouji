<template>
  <div ref="chatPageRef" class="wx-page wx-chat-page" @click="onPageClick">
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
            :selection-mode="selectionMode"
            :selected="selectedMessageIds.has(message.id)"
            @delete="deleteMessage"
            @action="handleMessageAction"
            @toggle-select="toggleMessageSelection"
            @open-diary="openDiaryNotice"
            @claim-wallet="claimWalletMessage"
            @refund-transfer="refundTransferMessage"
          />
        </template>
      </div>
    </div>

    <div v-if="replyingTo && !selectionMode" class="wx-reply-draft">
      <div>
        <span>引用</span>
        <p>{{ messagePreview(replyingTo) }}</p>
      </div>
      <button @click="replyingTo = null">×</button>
    </div>

    <div v-if="selectionMode" class="wx-selection-bar">
      <button @click="cancelSelection">取消</button>
      <span>已选 {{ selectedMessageIds.size }} 条</span>
      <button class="danger" :disabled="selectedMessageIds.size === 0" @click="deleteSelectedMessages">删除</button>
    </div>

    <chat-input
      v-else
      ref="chatInputRef"
      :wallet-balance-cents="walletBalanceCents"
      @send="sendTextMessage"
      @send-image="sendImageMessage"
      @send-wallet="sendWalletMessage"
      @generate="generateReply"
    />
    <heart-voice-panel
      :visible="heartVoiceOpen"
      :loading="heartVoiceLoading"
      :error="heartVoiceError"
      :data="heartVoiceData"
      :role-name="role?.name || ''"
      variant="wechat"
      :saved="heartVoiceSaved"
      :saving="heartVoiceSaving"
      @close="heartVoiceOpen = false"
      @retry="generateHeartVoice"
      @save="saveHeartVoice"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ChatInput from '../components/ChatInput.vue';
import HeartVoicePanel from '../components/HeartVoicePanel.vue';
import { conversationService, diaryService, messageService, roleService, apiProfileService, stickerService, assetService, walletService, parseAmountToCents } from '../services/db';
import { callClaude } from '../services/claude';
import { textToSpeech } from '../services/minimax';
import { parseMessageDirectives } from '../utils/directiveParser';
import { buildEnhancedSystemPrompt, buildHeartVoiceSystemPrompt } from '../utils/promptBuilder';
import { buildHeartVoiceMessages, parseHeartVoiceResponse } from '../utils/heartVoice';
import { createHeartVoiceMemory, normalizeProfile } from '../composables/useCharProfile';

const route = useRoute();
const router = useRouter();
const conversationId = parseInt(route.params.id);

const goDetails = () => { router.push(`/chat-details/conv/${conversationId}`); };

const onHeart = () => {
  heartVoiceOpen.value = true;
  generateHeartVoice();
  return;
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
const selectionMode = ref(false);
const selectedMessageIds = ref(new Set());
const replyingTo = ref(null);
const heartVoiceOpen = ref(false);
const heartVoiceLoading = ref(false);
const heartVoiceError = ref('');
const heartVoiceData = ref(null);
const heartVoiceSaving = ref(false);
const heartVoiceSaved = ref(false);

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

const vpResizeHandler = () => {
  if (chatPageRef.value && window.visualViewport) {
    chatPageRef.value.style.height = window.visualViewport.height + 'px';
  }
};

onMounted(async () => {
  loadUserAvatar();
  await loadConversation();
  await loadWalletBalance();
  await loadMessages();
  scrollToBottom();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', vpResizeHandler);
    window.visualViewport.addEventListener('scroll', vpResizeHandler);
  }
});

onUnmounted(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', vpResizeHandler);
    window.visualViewport.removeEventListener('scroll', vpResizeHandler);
  }
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

  if (role.value?.apiProfileId) {
    const apiProfile = await apiProfileService.getById(role.value.apiProfileId);
    if (apiProfile) {
      role.value = { ...role.value, apiKey: apiProfile.apiKey, baseUrl: apiProfile.baseUrl, model: apiProfile.model, apiFormat: apiProfile.apiFormat };
    }
  } else {
    const allProfiles = await apiProfileService.getAll();
    if (allProfiles.length > 0) {
      const defaultProfile = allProfiles[0];
      role.value = { ...role.value, apiKey: defaultProfile.apiKey, baseUrl: defaultProfile.baseUrl, model: defaultProfile.model, apiFormat: defaultProfile.apiFormat };
    }
  }

  const settings = role.value?.chatSettings || {};
  if (settings.linkedLibraryId) {
    linkedStickers.value = await stickerService.getByLibrary(settings.linkedLibraryId);
  }

  await conversationService.markAsRead(conversationId);
};

const refreshRoleSettings = async () => {
  if (!role.value?.id) return;
  const latestRole = await roleService.getById(role.value.id);
  if (!latestRole) return;
  role.value = { ...role.value, ...latestRole };
  const settings = role.value?.chatSettings || {};
  linkedStickers.value = settings.linkedLibraryId
    ? await stickerService.getByLibrary(settings.linkedLibraryId)
    : [];
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
const chatPageRef = ref(null);

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

const makeReplyPayload = (message) => ({
  id: message.id,
  role: message.role,
  type: message.type,
  content: messagePreview(message),
  audioUrl: !!message.audioUrl
});

const messagePreview = (message) => {
  if (!message) return '';
  if (message.type === 'image') return '[图片]';
  if (message.type === 'sticker') return '[表情]';
  if (message.type === 'redpacket') return '[红包]';
  if (message.type === 'transfer') return '[转账]';
  if (message.audioUrl) return `[语音] ${message.content || ''}`.trim();
  return String(message.content || '').replace(/\s+/g, ' ').slice(0, 80);
};

const toggleMessageSelection = (id) => {
  const next = new Set(selectedMessageIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedMessageIds.value = next;
};

const cancelSelection = () => {
  selectionMode.value = false;
  selectedMessageIds.value = new Set();
};

const startSelection = (message) => {
  selectionMode.value = true;
  selectedMessageIds.value = new Set([message.id]);
};

const deleteMessage = async (id) => {
  if (!confirm('确定删除这条信息吗？')) return;
  await messageService.delete(id);
  if (replyingTo.value?.id === id) replyingTo.value = null;
  await loadMessages();
};

const deleteSelectedMessages = async () => {
  const ids = [...selectedMessageIds.value];
  if (ids.length === 0) return;
  if (!confirm(`确定删除选中的 ${ids.length} 条信息吗？`)) return;
  await messageService.deleteMany(ids);
  if (replyingTo.value && ids.includes(replyingTo.value.id)) replyingTo.value = null;
  cancelSelection();
  await loadMessages();
};

const withdrawMessage = async (message) => {
  if (!confirm('确定撤回这条信息吗？')) return;
  const notice = message.role === 'user' ? '你撤回了一条信息' : `${role.value?.name || '角色'}撤回了一条信息`;
  await messageService.withdraw(message.id, notice);
  if (replyingTo.value?.id === message.id) replyingTo.value = null;
  await loadMessages();
};

const handleMessageAction = async ({ action, message }) => {
  if (action === 'select') startSelection(message);
  if (action === 'withdraw') await withdrawMessage(message);
  if (action === 'favorite') {
    await messageService.update(message.id, {
      isFavorite: !message.isFavorite,
      favoriteAt: message.isFavorite ? null : Date.now()
    });
    await loadMessages();
  }
  if (action === 'quote') replyingTo.value = message;
};

const openDiaryNotice = (diaryId) => {
  router.push({ path: '/diary', query: { diaryId } });
};

const generateHeartVoice = async () => {
  if (!role.value || heartVoiceLoading.value) return;
  heartVoiceLoading.value = true;
  heartVoiceError.value = '';
  heartVoiceSaved.value = false;
  try {
    const contextLength = Math.max(20, role.value?.chatSettings?.contextLength || 15);
    const contextMessages = await messageService.getCombinedContext(role.value.id, contextLength);
    const systemPrompt = await buildHeartVoiceSystemPrompt(role.value, contextMessages);
    const response = await callClaude(
      { ...role.value, systemPrompt, skipSystemPromptMerge: true },
      buildHeartVoiceMessages(contextMessages)
    );
    heartVoiceData.value = parseHeartVoiceResponse(response);
  } catch (error) {
    heartVoiceError.value = error.message || '心声生成失败';
  } finally {
    heartVoiceLoading.value = false;
  }
};

const saveHeartVoice = async () => {
  if (!role.value?.id || !heartVoiceData.value || heartVoiceSaving.value || heartVoiceSaved.value) return;
  heartVoiceSaving.value = true;
  try {
    const latestRole = await roleService.getById(role.value.id);
    const profile = normalizeProfile(latestRole?.profile || role.value.profile);
    const memoryItems = [createHeartVoiceMemory(heartVoiceData.value), ...profile.memoryItems].slice(0, 80);
    const updatedRole = await roleService.update(role.value.id, {
      profile: { ...profile, memoryItems }
    });
    role.value = { ...role.value, profile: updatedRole.profile };
    heartVoiceSaved.value = true;
  } finally {
    heartVoiceSaving.value = false;
  }
};

const sendTextMessage = async (text) => {
  try {
    const extra = replyingTo.value ? { replyTo: makeReplyPayload(replyingTo.value) } : {};
    await messageService.create(conversationId, 'user', text, 'text', null, extra);
    replyingTo.value = null;
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

const removeDirectiveRaws = (text, directives) => {
  return directives.reduce((result, directive) => {
    return directive.raw ? result.replace(directive.raw, '') : result;
  }, text || '').trim();
};

const createAssistantWalletSequence = async (text, walletDirective, directivesToHide = []) => {
  if (!walletDirective) {
    await createAssistantTextMessages(removeDirectiveRaws(text, directivesToHide));
    return;
  }

  const before = text.slice(0, walletDirective.index).trim();
  const after = text.slice(walletDirective.index + walletDirective.raw.length).trim();

  await createAssistantTextMessages(removeDirectiveRaws(before, directivesToHide));
  await walletService.createIncoming({
    conversationId,
    roleId: role.value.id,
    type: walletDirective.type,
    amountCents: parseAmountToCents(walletDirective.amount),
    note: walletDirective.note
  });
  await loadMessages();
  await createAssistantTextMessages(removeDirectiveRaws(after, directivesToHide));
};

const generateReply = async () => {
  try {
    isTyping.value = true;
    const startTime = Date.now();
    await refreshRoleSettings();

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

    const settings = role.value?.chatSettings || {};
    const enhancedPrompt = await buildEnhancedSystemPrompt(role.value, contextMessages);

    const useStream = localStorage.getItem('useStreamAPI') === 'true';
    let fullResponse = '';

    const response = await callClaude(
      { ...role.value, systemPrompt: enhancedPrompt, skipSystemPromptMerge: true },
      apiMessages,
      useStream ? async (chunk) => {
        fullResponse += chunk;
        const parsedChunk = parseMessageDirectives(chunk);
        if (parsedChunk.cleanText) {
          await messageService.create(conversationId, 'assistant', parsedChunk.cleanText, 'text', null);
          await loadMessages();
        }
      } : null
    );

    const elapsed = Date.now() - startTime;
    if (elapsed < 800) await sleep(800 - elapsed);

    const rawText = useStream ? fullResponse : response;
    const parsedResponse = parseMessageDirectives(rawText);
    const voiceDirective = parsedResponse.directives.find(d => d.type === 'voice');
    const walletDirectives = parsedResponse.directives.filter(d => d.type === 'redpacket' || d.type === 'transfer');
    const walletDirective = walletDirectives.find(d => d.executable);
    const diaryDirectives = parsedResponse.directives.filter(d => d.type === 'diary');
    const diaryDirective = diaryDirectives.find(d => d.executable);
    const hiddenDirectives = [...walletDirectives, ...diaryDirectives];

    if (diaryDirective?.content) {
      try {
        const diary = await diaryService.create({
          authorType: 'role',
          roleId: role.value.id,
          linkedRoleIds: [role.value.id],
          dateKey: toDateKey(),
          title: diaryDirective.title || `${formatMessageTime(Date.now())}的日记`,
          content: diaryDirective.content,
          visibility: 'role_visible',
          includeInContext: true,
          source: 'directive'
        });
        await messageService.create(
          conversationId,
          'system',
          `${role.value?.name || '角色'}写了一篇日记 >`,
          'diary_notice',
          null,
          { diaryId: diary.id }
        );
      } catch (error) {
        console.warn('角色日记写入失败:', error.message);
      }
    }

    if (voiceDirective) {
      let audioUrl = null;
      try {
        audioUrl = await textToSpeech(voiceDirective.text, {
          voiceId: settings.minimaxVoiceId,
          model: settings.minimaxModel,
          speed: settings.minimaxSpeed,
          pitch: settings.minimaxPitch
        });
      } catch (error) {
        console.warn('语音生成失败:', error.message);
      }

      if (!useStream) {
        // 非流式：文字+语音都在全量响应里，按顺序建气泡
        const textBefore = rawText.slice(0, voiceDirective.index).trim();
        const textAfter = rawText.slice(voiceDirective.index + voiceDirective.raw.length).trim();
        if (textBefore) await createAssistantTextMessages(removeDirectiveRaws(textBefore, hiddenDirectives));
      }
      if (voiceDirective.text || audioUrl) {
        await messageService.create(conversationId, 'assistant', voiceDirective.text, 'text', audioUrl);
        await loadMessages();
      }
      if (!useStream) {
        const textAfter = rawText.slice(voiceDirective.index + voiceDirective.raw.length).trim();
        if (textAfter) await createAssistantTextMessages(removeDirectiveRaws(textAfter, hiddenDirectives));
      }
    } else if (!useStream && (rawText || walletDirective)) {
      await createAssistantWalletSequence(rawText, walletDirective, hiddenDirectives);
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

const toDateKey = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: var(--vvh, 100dvh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 0%, rgba(255, 255, 255, 0.72), transparent 34%),
    var(--wx-bg);
}

.wx-time-label {
  text-align: center;
  font-size: 11px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.38);
  margin: 10px 0 14px;
  pointer-events: none;
}

.wx-reply-draft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid var(--wx-border);
  background: rgba(247, 247, 247, 0.96);
  color: var(--wx-text-primary);
  flex-shrink: 0;
}
.wx-reply-draft span {
  display: block;
  margin-bottom: 2px;
  color: var(--wx-blue);
  font-size: 12px;
}
.wx-reply-draft p {
  margin: 0;
  color: var(--wx-text-secondary);
  font-size: 13px;
  line-height: 1.35;
}
.wx-reply-draft button,
.wx-selection-bar button {
  border: none;
  background: transparent;
  color: var(--wx-blue);
  font-size: 15px;
}
.wx-selection-bar {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  padding: 9px 12px calc(9px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--wx-border);
  background: rgba(247, 247, 247, 0.98);
  color: var(--wx-text-secondary);
  font-size: 14px;
  text-align: center;
  flex-shrink: 0;
}
.wx-selection-bar .danger {
  color: #fa5151;
}
.wx-selection-bar button:disabled {
  color: var(--wx-text-tertiary);
}

[data-theme="dark"] .wx-reply-draft,
[data-theme="dark"] .wx-selection-bar {
  background: rgba(28, 28, 28, 0.96);
}

.wx-chat-page :deep(.wx-navbar-wrap) {
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  flex-shrink: 0;
  width: 100%;
  height: calc(var(--chat-navbar-height) + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-sizing: border-box;
  z-index: 10;
}

[data-theme="dark"] .wx-chat-page :deep(.wx-navbar-wrap) {
  background: rgba(28, 28, 28, 0.92);
}

.wx-chat-page :deep(.wx-navbar) {
  height: var(--chat-navbar-height);
  min-height: var(--chat-navbar-height);
  flex-shrink: 0;
}

.wx-chat-page :deep(.input-container) {
  position: relative;
  bottom: auto;
  left: auto;
  right: auto;
  flex-shrink: 0;
}

.wx-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 0;
  padding-bottom: 18px;
  background-color: var(--wx-bg);
  box-sizing: border-box;
  overscroll-behavior: contain;
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
  padding: 7px 16px;
  background-color: rgba(255, 255, 255, 0.78);
  color: var(--wx-text-secondary);
  border: 1px solid var(--wx-border);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--wx-shadow-soft);
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
