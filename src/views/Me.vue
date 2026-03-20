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
        <div class="wx-list-item">
          <div style="width: 24px; height: 24px; margin-right: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">设置</div>
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
