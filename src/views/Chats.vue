<template>
  <div class="wx-page">
    <nav-bar title="微信" />

    <div class="wx-content">
      <div v-if="conversations.length === 0" class="wx-empty">
        <svg class="wx-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <div class="wx-empty-text">暂无会话</div>
        <div class="wx-empty-text">去通讯录添加角色开始聊天吧</div>
      </div>

      <div v-else class="wx-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="wx-list-item"
          @click="openChat(conv)"
        >
          <img class="wx-list-avatar" :src="conv.role?.avatar || defaultAvatar" alt="avatar" />
          <div class="wx-list-content">
            <div class="wx-list-title">{{ conv.role?.name || '未知角色' }}</div>
            <div class="wx-list-desc">{{ conv.lastMessage || '暂无消息' }}</div>
          </div>
          <div class="wx-list-meta">
            <div class="wx-list-time">{{ formatTime(conv.updatedAt) }}</div>
            <div v-if="conv.unread > 0" class="wx-list-badge">{{ conv.unread }}</div>
          </div>
        </div>
      </div>
    </div>

    <tab-bar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import TabBar from '../components/TabBar.vue';
import { conversationService } from '../services/db';

const router = useRouter();
const conversations = ref([]);
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48" rx="4"/%3E%3Cpath fill="%23999" d="M24 12a6 6 0 100 12 6 6 0 000-12zm0 16c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6z"/%3E%3C/svg%3E';

onMounted(async () => {
  await loadConversations();
});

const loadConversations = async () => {
  conversations.value = await conversationService.getAll();
};

const openChat = (conv) => {
  router.push(`/chat/${conv.id}`);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return '昨天';
  }

  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return '星期' + days[date.getDay()];
  }

  // 更早
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};
</script>

<style scoped>
.wx-empty-icon {
  width: 64px;
  height: 64px;
  color: #c0c0c0;
  margin-bottom: 16px;
}
</style>
