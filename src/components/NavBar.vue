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
      <div class="wx-navbar-actions">
        <div v-if="showHeart" class="wx-navbar-heart" @click="onHeart">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <div v-if="action" class="wx-navbar-action" @click="onAction">
          {{ action }}
        </div>
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
  showHeart: {
    type: Boolean,
    default: false
  },
  action: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['action', 'heart']);

const router = useRouter();

const goBack = () => {
  router.back();
};

const onAction = () => {
  emit('action');
};

const onHeart = () => {
  emit('heart');
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

.wx-navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wx-navbar-heart {
  cursor: pointer;
  color: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wx-navbar-heart:active {
  opacity: 0.6;
}
</style>
