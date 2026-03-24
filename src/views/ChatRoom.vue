<template>
  <div class="wx-page" @click="onPageClick">
    <nav-bar :title="isTyping ? '对方正在输入…' : (role?.name || '聊天')" :show-back="true" :show-heart="true" action="•••" @action="goDetails" @heart="onHeart" />

    <div ref="messagesContainer" class="wx-content" :style="chatBackgroundStyle">
      <div v-if="messages.length === 0" class="wx-empty">
        <div class="wx-empty-icon">💬</div>
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
        />
      </div>
    </div>

    <chat-input ref="chatInputRef" @send="sendTextMessage" @send-image="sendImageMessage" @generate="generateReply" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ChatInput from '../components/ChatInput.vue';
import { conversationService, messageService, roleService, apiProfileService } from '../services/db';
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
const messagesContainer = ref(null);

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
  return bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
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

  // 标记为已读
  await conversationService.markAsRead(conversationId);
};

const loadMessages = async () => {
  messages.value = await messageService.getByConversation(conversationId);
};

const chatInputRef = ref(null);

const onPageClick = (e) => {
  if (!e.target.closest('.wx-input-bar')) {
    document.activeElement?.blur();
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
    const apiMessages = contextMessages.map(msg => ({ role: msg.role, content: msg.content }));

    // 如果开启了时间感知，添加时间信息到system prompt
    let roleWithTime = role.value;
    if (role.value?.chatSettings?.isRealTimeOn) {
      const now = new Date();
      const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      roleWithTime = {
        ...role.value,
        systemPrompt: `当前时间：${timeStr}\n\n${role.value.systemPrompt || ''}`
      };
    }

    const response = await callClaude(roleWithTime, apiMessages);

    const elapsed = Date.now() - startTime;
    if (elapsed < 800) await sleep(800 - elapsed);

    // 检测语音标记 [语音:文本内容]
    let audioUrl = null;
    const voiceMatch = response.match(/\[语音[:：]([^\]]+)\]/);
    if (voiceMatch) {
      try {
        const voiceText = voiceMatch[1].trim();
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

    // 按换行拆分，逐条延迟存入，模拟打字效果
    const parts = cleanResponse.split('\n').filter(p => p.trim());

    if (parts.length <= 1) {
      await messageService.create(conversationId, 'assistant', cleanResponse, 'text', audioUrl);
      await loadMessages();
    } else {
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) await sleep(500);
        await messageService.create(conversationId, 'assistant', parts[i], 'text', i === 0 ? audioUrl : null);
        await loadMessages();
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

    isTyping.value = true;
    const startTime = Date.now();

    // 图片请求使用较少上下文避免413错误
    const contextLength = Math.min(role.value?.chatSettings?.contextLength || 15, 5);
    const contextMessages = await messageService.getContext(conversationId, contextLength);
    const textContext = contextMessages
      .filter(msg => msg.type === 'text')
      .map(msg => ({ role: msg.role, content: msg.content }));

    const response = await callClaudeVision(role.value, compressedBase64, file.type, textContext);

    const elapsed = Date.now() - startTime;
    if (elapsed < 800) await sleep(800 - elapsed);

    await messageService.create(conversationId, 'assistant', response, 'text');
    await loadMessages();

    isTyping.value = false;
  } catch (error) {
    isTyping.value = false;
    alert('图片发送失败: ' + error.message);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 压缩图片
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
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
