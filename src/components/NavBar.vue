<template>
  <div class="wx-navbar-wrap">
    <div class="wx-navbar-safe-area-top"></div>
    <div class="wx-navbar">
      <div v-if="showBack" class="wx-navbar-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <div class="wx-navbar-title">{{ title }}</div>
      <div v-if="action" class="wx-navbar-action" @click="onAction">
        {{ action }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: false
  },
  action: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['action']);

const router = useRouter();

const goBack = () => {
  router.back();
};

const onAction = () => {
  emit('action');
};
</script>

<style scoped>
.wx-navbar-wrap {
  background-color: var(--wx-white);
}
.wx-navbar-safe-area-top {
  height: env(safe-area-inset-top);
  background-color: var(--wx-white);
}
</style>
