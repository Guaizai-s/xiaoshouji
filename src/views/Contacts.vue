<template>
  <div class="wx-page">
    <nav-bar title="通讯录" />

    <div class="wx-content">
      <!-- 新角色入口 -->
      <div class="wx-list" style="margin-bottom: 8px;">
        <div class="wx-list-item" @click="addRole">
          <div class="wx-list-avatar" style="background: linear-gradient(135deg, #f29c38 0%, #f5b041 100%); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 24px; height: 24px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">新角色</div>
          </div>
          <svg class="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <!-- 角色列表 -->
      <div v-if="roles.length === 0" class="wx-empty">
        <svg class="wx-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <div class="wx-empty-text">暂无角色</div>
        <div class="wx-empty-text">点击上方添加角色</div>
      </div>

      <div v-else class="wx-list">
        <div
          v-for="role in roles"
          :key="role.id"
          class="wx-list-item"
        >
          <img
            class="wx-list-avatar"
            :src="role.avatar || defaultAvatar"
            alt="avatar"
            @click="openChat(role)"
          />
          <div class="wx-list-content" @click="openChat(role)">
            <div class="wx-list-title">{{ role.name }}</div>
            <div class="wx-list-desc">{{ role.systemPrompt || '暂无系统提示词' }}</div>
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
import { roleService, conversationService } from '../services/db';

const router = useRouter();
const roles = ref([]);
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48" rx="4"/%3E%3Cpath fill="%23999" d="M24 12a6 6 0 100 12 6 6 0 000-12zm0 16c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6z"/%3E%3C/svg%3E';

onMounted(async () => {
  await loadRoles();
});

const loadRoles = async () => {
  roles.value = await roleService.getAll();
};

const addRole = () => {
  router.push('/contacts/new');
};

const openChat = async (role) => {
  const conversation = await conversationService.getOrCreate(role.id);
  router.push(`/chat/${conversation.id}`);
};
</script>

<style scoped>
.chevron-icon {
  width: 20px;
  height: 20px;
  color: #c0c0c0;
  margin-left: auto;
}

.wx-empty-icon {
  width: 64px;
  height: 64px;
  color: #c0c0c0;
  margin-bottom: 16px;
}
</style>
