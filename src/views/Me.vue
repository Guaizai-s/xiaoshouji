<template>
  <div class="wx-page">
    <nav-bar title="我" />

    <div class="wx-content">
      <div class="wx-list">
        <div class="wx-list-item" @click="openProfile">
          <img class="wx-list-avatar" :src="userAvatar" alt="avatar" />
          <div class="wx-list-content">
            <div class="wx-list-title">{{ userName }}</div>
            <div class="wx-list-desc">微信号: {{ userWxId }}</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="wx-divider"></div>

      <div class="wx-list">
        <div class="wx-list-item" @click="router.push('/personas')">
          <div style="width: 24px; height: 24px; margin-right: 12px; color: #10aeff;">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">用户设定</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div class="wx-list-item" @click="router.push('/stickers')">
          <div style="width: 24px; height: 24px; margin-right: 12px; color: #ffc300;">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 16c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">表情包上传</div>
          </div>
          <svg style="width: 18px; height: 18px; color: #999;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="wx-empty" style="margin-top: 48px;">
        <div class="wx-empty-text" style="font-size: 12px; color: #999;">
          小手机 v1.0.0
        </div>
        <div class="wx-empty-text" style="font-size: 12px; color: #999; margin-top: 8px;">
          高仿微信AI聊天应用
        </div>
      </div>
    </div>

    <tab-bar />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import TabBar from '../components/TabBar.vue';

const router = useRouter();
const route = useRoute();

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%2307C160" width="48" height="48" rx="4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white"%3E我%3C/text%3E%3C/svg%3E';

const userName = ref('小手机用户');
const userWxId = ref('xiaoshouji_001');
const userAvatar = ref(defaultAvatar);

const loadUserProfile = () => {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      userName.value = data.name || '小手机用户';
      userWxId.value = data.wxId || 'xiaoshouji_001';
      userAvatar.value = data.avatar || defaultAvatar;
    } catch (error) {
      console.error('读取用户信息失败', error);
    }
  }
};

onMounted(() => {
  loadUserProfile();
});

watch(() => route.path, (newPath) => {
  if (newPath === '/me') loadUserProfile();
});

const openProfile = () => {
  router.push('/profile');
};
</script>

<style scoped>
</style>
