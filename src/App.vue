<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const updateVisualViewportHeight = () => {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--vvh', `${height}px`);
};

onMounted(() => {
  updateVisualViewportHeight();
  window.visualViewport?.addEventListener('resize', updateVisualViewportHeight);
});

onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', updateVisualViewportHeight);
});
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  background-color: #EDEDED;
  overflow: hidden;
}
</style>
