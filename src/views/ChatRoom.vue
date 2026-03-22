<template>
  <div class="wx-page" @click="onPageClick">
    <nav-bar :title="isTyping ? '对方正在输入…' : (role?.name || '聊天')" :show-back="true" action="•••" @action="goDetails" />

    <div ref="messagesContainer" class="wx-content">
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

    <chat-input ref="chatInputRef" @send="sendTextMessage" @send-image="sendImageMessage" />
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

const route = useRoute();
const router = useRouter();
const conversationId = parseInt(route.params.id);

const goDetails = () => { router.push(`/chat-details/conv/${conversationId}`); };

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

    isTyping.value = true;
    const startTime = Date.now();

    const contextMessages = await messageService.getContext(conversationId, 15);
    const apiMessages = contextMessages.map(msg => ({ role: msg.role, content: msg.content }));

    const response = await callClaude(role.value, apiMessages);

    const elapsed = Date.now() - startTime;
    if (elapsed < 800) await sleep(800 - elapsed);

    // 按换行拆分，逐条延迟存入，模拟打字效果
    const parts = response.split('\n').filter(p => p.trim());
    if (parts.length <= 1) {
      await messageService.create(conversationId, 'assistant', response, 'text');
      await loadMessages();
    } else {
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) await sleep(500);
        await messageService.create(conversationId, 'assistant', parts[i], 'text');
        await loadMessages();
      }
    }

    isTyping.value = false;
  } catch (error) {
    isTyping.value = false;
    alert('发送失败: ' + error.message);
  }
};

const sendImageMessage = async (file) => {
  try {
    const base64 = await fileToBase64(file);
    const dataUrl = `data:${file.type};base64,${base64}`;

    await messageService.create(conversationId, 'user', dataUrl, 'image');
    await loadMessages();

    isTyping.value = true;
    const startTime = Date.now();

    // 获取文字上下文
    const contextMessages = await messageService.getContext(conversationId, 15);
    const textContext = contextMessages
      .filter(msg => msg.type === 'text')
      .map(msg => ({ role: msg.role, content: msg.content }));

    const response = await callClaudeVision(role.value, base64, file.type, textContext);

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
</script>
