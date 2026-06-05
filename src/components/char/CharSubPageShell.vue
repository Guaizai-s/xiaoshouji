<template>
  <main class="char-subpage">
    <header class="subpage-hero">
      <div class="subpage-toolbar">
        <button aria-label="返回角色首页" @click="$emit('back')"><i class="ph ph-caret-left"></i></button>
      </div>
      <div class="subpage-title">
        <span>{{ role.name || '未命名角色' }}</span>
        <h1>{{ title }}</h1>
      </div>
    </header>

    <section class="subpage-body">
      <slot />
    </section>
  </main>
</template>

<script setup>
defineProps({
  role: { type: Object, required: true },
  title: { type: String, required: true }
});

defineEmits(['back']);
</script>

<style scoped>
.char-subpage {
  min-height: var(--vvh, 100dvh);
  color: var(--char-text);
}

.subpage-hero {
  position: relative;
  padding: calc(14px + env(safe-area-inset-top)) 18px 18px;
  overflow: hidden;
}

.subpage-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.72), transparent 42%),
    linear-gradient(180deg, var(--char-bg-start) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.subpage-toolbar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-start;
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
  position: relative;
  z-index: 2;
  margin-top: 24px;
  color: var(--char-text);
}

.subpage-title span {
  color: var(--char-text-soft);
  font-size: 13px;
  font-weight: 800;
}

.subpage-title h1 {
  margin: 8px 0 0;
  color: var(--char-text-strong);
  font-size: 34px;
  line-height: 1.1;
}

.subpage-body {
  position: relative;
  z-index: 3;
  min-height: calc(100dvh - 154px - env(safe-area-inset-top));
  padding: 22px 16px calc(42px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  background: linear-gradient(180deg, var(--char-body-start) 0%, var(--char-body-end) 100%);
}
</style>
