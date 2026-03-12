<template>
  <div class="wx-tabbar">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="wx-tabbar-item"
      :class="{ active: isActive(tab.path) }"
      @click="navigate(tab.path)"
    >
      <svg
        class="wx-tabbar-icon"
        viewBox="0 0 24 24"
        :fill="isActive(tab.path) ? 'currentColor' : 'none'"
        stroke="currentColor"
        :stroke-width="isActive(tab.path) ? 0 : 1.5"
      >
        <path v-if="tab.icon === 'message'" stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        <path v-if="tab.icon === 'contacts'" stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <template v-if="tab.icon === 'discover'">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 8l-8 4-4 8 8-4 4-8z" />
          <circle cx="12" cy="12" r="9" />
        </template>
        <path v-if="tab.icon === 'me'" stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span class="wx-tabbar-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const tabs = [
  { path: '/chats', icon: 'message', label: '微信' },
  { path: '/contacts', icon: 'contacts', label: '通讯录' },
  { path: '/discover', icon: 'discover', label: '发现' },
  { path: '/me', icon: 'me', label: '我' }
];

const isActive = (path) => {
  return route.path === path;
};

const navigate = (path) => {
  if (route.path !== path) {
    router.replace(path);
  }
};
</script>

<style scoped>
.wx-tabbar-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}
</style>
