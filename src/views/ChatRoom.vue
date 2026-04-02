<template>
  <div class="wx-page" @click="onPageClick">
    <nav-bar :title="isTyping ? '对方正在输入…' : (role?.name || '聊天')" :show-back="true" :show-heart="true" action="•••" @action="goDetails" @heart="onHeart" />

    <div ref="messagesContainer" class="wx-content" :style="chatBackgroundStyle">
      <div v-if="messages.length === 0 && !isLoading" class="wx-empty">
        <div class="wx-empty-text">暂无消息</div>
        <div class="wx-empty-text">发送第一条消息开始对话</div>
      </div>

      <div v-else class="wx-messages">
        <message-bubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :user-avatar="userAvatar"
          :role-avatar="role?.avatar || defaultAvatar"
          :linked-stickers="linkedStickers"
        />
      </div>
    </div>

    <chat-input ref="chatInputRef" @send="sendTextMessage" @send-image="sendImageMessage" @generate="generateReply" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ChatInput from '../components/ChatInput.vue';
import { conversationService, messageService, roleService, apiProfileService, personaService, stickerService, stickerLibraryService } from '../services/db';
import { callClaude, callClaudeVision, fileToBase64 } from '../services/claude';
import { textToSpeech } from '../services/minimax';

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
const messages = ref([]);
const isTyping = ref(false);
const isLoading = ref(true);
const messagesContainer = ref(null);
const linkedStickers = ref([]);

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
  await loadMessages();
  scrollToBottom();
});

watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

const loadConversation = async () => {
  conversation.value = await conversationService.getOrCreate(conversationId);
  role.value = await roleService.getById(conversation.value.roleId);

  // 如果角色关联了API方案，获取配置并合并到role对象
  if (role.value?.apiProfileId) {
    const apiProfile = await apiProfileService.getById(role.value.apiProfileId);
    if (apiProfile) {
      role.value = {
        ...role.value,
        apiKey: apiProfile.apiKey,
        baseUrl: apiProfile.baseUrl,
        model: apiProfile.model,
        apiFormat: apiProfile.apiFormat
      };
    }
  }

  // 加载关联的表情包
  const settings = role.value?.chatSettings || {};
  if (settings.linkedLibraryId) {
    linkedStickers.value = await stickerService.getByLibrary(settings.linkedLibraryId);
  }

  // 标记为已读
  await conversationService.markAsRead(conversationId);
};

const loadMessages = async () => {
  messages.value = await messageService.getByConversation(conversationId);
  isLoading.value = false;
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

const sendTextMessage = async (text) => {
  try {
    await messageService.create(conversationId, 'user', text, 'text');
    await loadMessages();
  } catch (error) {
    alert('发送失败: ' + error.message);
  }
};

const generateReply = async () => {
  try {
    isTyping.value = true;
    const startTime = Date.now();

    const contextLength = role.value?.chatSettings?.contextLength || 15;
    const contextMessages = await messageService.getContext(conversationId, contextLength);
    const apiMessages = contextMessages.map(msg => {
      // 如果是语音消息，恢复语音标记格式
      if (msg.audioUrl && msg.content) {
        return { role: msg.role, content: `[语音:${msg.content}]` };
      }
      return { role: msg.role, content: msg.content };
    });

    // 构建增强的系统提示词
    let enhancedPrompt = role.value.systemPrompt || '';

    // 添加时间感知
    if (role.value?.chatSettings?.isRealTimeOn) {
      const now = new Date();
      const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      enhancedPrompt = `当前时间：${timeStr}\n\n${enhancedPrompt}`;
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
    const useStream = localStorage.getItem('useStreamAPI') === 'true';
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
            speed: voiceSettings.minimaxSpeed,
            pitch: voiceSettings.minimaxPitch
          });
          // 更新第一条消息添加audioUrl
          const msgs = await messageService.getByConversation(conversationId);
          const lastAssistantMsg = msgs.filter(m => m.role === 'assistant').pop();
          if (lastAssistantMsg) {
            await messageService.update(lastAssistantMsg.id, { audioUrl });
            await loadMessages();
          }
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
            speed: voiceSettings.minimaxSpeed,
            pitch: voiceSettings.minimaxPitch
          });
        } catch (error) {
          console.warn('语音生成失败:', error.message);
        }
      }

      // 移除语音标记，只保留文本
      const cleanResponse = response.replace(/\[语音[:：][^\]]+\]/g, '').trim();

      // 确定最终内容：优先使用cleanResponse，如果为空且有语音则使用语音文本
      const finalContent = cleanResponse || voiceText;

      // 只有在有内容或有语音时才创建消息
      if (finalContent || audioUrl) {
        // 按换行拆分，逐条延迟存入
        const parts = finalContent.split('\n').filter(p => p.trim());

        if (parts.length <= 1) {
          await messageService.create(conversationId, 'assistant', finalContent, 'text', audioUrl);
          await loadMessages();
        } else {
          for (let i = 0; i < parts.length; i++) {
            if (i > 0) await sleep(500);
            await messageService.create(conversationId, 'assistant', parts[i], 'text', i === 0 ? audioUrl : null);
            await loadMessages();
          }
        }
      }
    }

    isTyping.value = false;
  } catch (error) {
    isTyping.value = false;
    alert('生成失败: ' + error.message);
  }
};

const sendImageMessage = async (file) => {
  try {
    // 压缩图片
    const compressedBase64 = await compressImage(file);
    const dataUrl = `data:${file.type};base64,${compressedBase64}`;

    await messageService.create(conversationId, 'user', dataUrl, 'image');
    await loadMessages();
  } catch (error) {
    alert('图片发送失败: ' + error.message);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 压缩图片
const compressImage = (file, maxWidth = 1200, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL(file.type, quality).split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
</script>
