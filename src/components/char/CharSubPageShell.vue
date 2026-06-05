<template>
  <main class="char-subpage">
    <header class="subpage-hero">
      <div class="subpage-hero-media" :style="coverStyle(role)"></div>
      <div class="subpage-toolbar">
        <button aria-label="返回角色首页" @click="$emit('back')"><i class="ph ph-caret-left"></i></button>
        <button aria-label="聊天设置" @click="$emit('settings')"><i class="ph ph-dots-three"></i></button>
      </div>
      <div class="subpage-title">
        <span>{{ role.name || '未命名角色' }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </header>

    <section class="subpage-body">
      <slot />
    </section>
  </main>
</template>

<script setup>
import { coverStyle } from '../../composables/useCharProfile';

defineProps({
  description: { type: String, default: '' },
  role: { type: Object, required: true },
  title: { type: String, required: true }
});

defineEmits(['back', 'settings']);
</script>

<style scoped>
.char-subpage {
  min-height: var(--vvh, 100dvh);
  color: var(--char-text);
}

.subpage-hero {
  position: relative;
  min-height: 236px;
  padding-top: env(safe-area-inset-top);
  overflow: hidden;
}

.subpage-hero-media {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(75, 60, 48, 0.2), rgba(255, 255, 255, 0.36)),
    var(--char-surface-muted);
  background-size: cover;
  background-position: center;
  filter: saturate(0.96);
}

.subpage-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.68) 100%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.36), transparent 52%);
}

.subpage-toolbar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  padding: 16px 18px;
}

.subpage-toolbar button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  color: var(--char-text);
  background: var(--char-surface);
  box-shadow: 0 8px 20px var(--char-shadow);
}

.subpage-title {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 28px;
  z-index: 2;
  color: #fff;
}

.subpage-title span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  font-weight: 800;
}

.subpage-title h1 {
  margin: 8px 0 0;
  font-size: 30px;
  line-height: 1.1;
}

.subpage-title p {
  margin: 9px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  line-height: 1.5;
}

.subpage-body {
  position: relative;
  z-index: 3;
  min-height: calc(100dvh - 218px);
  margin-top: -18px;
  padding: 22px 16px calc(42px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  background: linear-gradient(180deg, var(--char-body-start) 0%, var(--char-body-end) 100%);
}
</style>
