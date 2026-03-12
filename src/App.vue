<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <transition :name="getTransitionName(route)" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// Tab 页面列表（分支模式，使用淡入淡出）
const tabPages = ['/chats', '/contacts', '/discover', '/me'];

// 根据路由路径决定过渡效果
const getTransitionName = (route) => {
  // Tab之间切换使用淡入淡出
  if (tabPages.includes(route.path)) {
    return 'fade';
  }
  // 其他页面使用滑动
  return 'slide';
};
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  background-color: #EDEDED;
  overflow: hidden;
}

/* 滑动过渡（用于进入子页面） */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* 淡入淡出过渡（用于Tab切换） */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
