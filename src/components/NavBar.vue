<template>
  <div class="wx-navbar">
    <div v-if="showBack" class="wx-navbar-back" @click="goBack">
      ← 返回
    </div>
    <div class="wx-navbar-title">{{ title }}</div>
    <div v-if="action" class="wx-navbar-action" @click="onAction">
      {{ action }}
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
