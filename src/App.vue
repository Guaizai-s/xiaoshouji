<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </router-view>
  </div>
</template>

<script setup>
</script>

<style>
#app {
  width: 100%;
  height: 100dvh;
  background-color: #EDEDED;
  overflow: hidden;
}
</style>
