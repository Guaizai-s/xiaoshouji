<template>
  <div class="wx-page">
    <nav-bar title="朋友圈" :show-back="true" />

    <div class="wx-content">
      <div class="wx-empty" style="margin-top: 100px;">
        <svg class="wx-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10M12 2a10 10 0 0 0-10 10M12 22a10 10 0 0 1 10-10M12 22a10 10 0 0 0-10-10" />
        </svg>
        <div class="wx-empty-text">朋友圈功能开发中</div>
        <div class="wx-empty-text" style="margin-top: 8px; font-size: 12px;">
          未来可能支持角色之间的互动
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue';
</script>

<style scoped>
.wx-empty-icon {
  width: 64px;
  height: 64px;
  color: #c0c0c0;
  margin-bottom: 16px;
}
</style>
