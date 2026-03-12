<template>
  <div class="wx-page">
    <nav-bar title="发现" />

    <div class="wx-content">
      <div class="wx-list">
        <div class="wx-list-item" @click="openMoments">
          <div style="width: 24px; height: 24px; margin-right: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10M12 2a10 10 0 0 0-10 10M12 22a10 10 0 0 1 10-10M12 22a10 10 0 0 0-10-10" />
            </svg>
          </div>
          <div class="wx-list-content">
            <div class="wx-list-title">朋友圈</div>
          </div>
        </div>
      </div>

      <div class="wx-divider"></div>

      <div class="wx-empty" style="margin-top: 48px;">
        <svg class="wx-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div class="wx-empty-text">更多功能开发中...</div>
      </div>
    </div>

    <tab-bar />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import TabBar from '../components/TabBar.vue';

const router = useRouter();

const openMoments = () => {
  router.push('/moments');
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
