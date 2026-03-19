// 聊天界面
<template>
  <div class="wx-page">
    <nav-bar :title="isTyping ? '对方正在输入...' : (role?.name || '聊天')" :show-back="true" />

    <div ref="messagesContainer" class="wx-content">
      <div v-if="messages.length === 0" class="wx-empty">
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

    <chat-input @send="sendTextMessage" @send-image="sendImageMessage" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ChatInput from '../components/ChatInput.vue';
import { conversationService, messageService, roleService } from '../services/db';
import { callClaude, callClaudeVision, fileToBase64 } from '../services/claude';

const route = useRoute();
const conversationId = parseInt(route.params.id);

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

  // 标记为已读
  await conversationService.markAsRead(conversationId);
};

const loadMessages = async () => {
  messages.value = await messageService.getByConversation(conversationId);
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendTextMessage = async (text) => {
  try {
    // 1. 保存用户消息
    await messageService.create(conversationId, 'user', text, 'text');
    await loadMessages();

    // 2. 显示"正在输入"状态
    isTyping.value = true;

    // 3. 记录开始时间
    const startTime = Date.now();

    // 4. 获取上下文消息（最近15轮）
    const contextMessages = await messageService.getContext(conversationId, 15);
    const apiMessages = contextMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 5. 调用 API
    const response = await callClaude(role.value, apiMessages);

    // 6. 智能延迟（模拟打字）
    const elapsed = Date.now() - startTime;
    const minDelay = 800;
    if (elapsed < minDelay) {
      await sleep(minDelay - elapsed);
    }

    // 7. 保存 AI 回复
    await messageService.create(conversationId, 'assistant', response, 'text');
    await loadMessages();

    isTyping.value = false;
  } catch (error) {
    isTyping.value = false;
    alert('发送失败: ' + error.message);
  }
};

const sendImageMessage = async (file) => {
  try {
    // 1. 读取图片
    const base64 = await fileToBase64(file);
    const imageUrl = URL.createObjectURL(file);

    // 2. 保存用户图片消息
    await messageService.create(conversationId, 'user', imageUrl, 'image');
    await loadMessages();

    // 3. 显示"正在输入"状态
    isTyping.value = true;

    // 4. 记录开始时间
    const startTime = Date.now();

    // 5. 调用 Vision API
    const response = await callClaudeVision(role.value, base64, file.type);

    // 6. 智能延迟
    const elapsed = Date.now() - startTime;
    const minDelay = 800;
    if (elapsed < minDelay) {
      await sleep(minDelay - elapsed);
    }

    // 7. 保存 AI 回复
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
