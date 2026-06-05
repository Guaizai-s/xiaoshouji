<template>
  <main class="char-home-dashboard">
    <section class="home-cover" :style="coverStyle(role)">
      <div class="home-toolbar">
        <button aria-label="返回" @click="$emit('back')"><i class="ph ph-caret-left"></i></button>
        <button aria-label="聊天设置" @click="$emit('settings')"><i class="ph ph-dots-three"></i></button>
      </div>
      <div class="cover-shade"></div>
      <div class="home-title">
        <span>{{ profile.profession || 'Character Archive' }}</span>
        <h1>{{ role.name || '未命名角色' }}</h1>
        <p>{{ roleSummary(role, 96) }}</p>
      </div>
    </section>

    <section class="branch-panel" aria-label="角色分支页面">
      <button
        v-for="item in branchItems"
        :key="item.id"
        class="branch-card"
        @click="$emit('open-section', item.id)"
      >
        <i :class="item.icon"></i>
        <span>
          <strong>{{ item.title }}</strong>
          <small>{{ item.summary }}</small>
        </span>
        <em>{{ item.meta }}</em>
      </button>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { coverStyle, roleSummary } from '../../composables/useCharProfile';

const props = defineProps({
  archiveText: { type: String, default: '' },
  memoryCount: { type: Number, default: 0 },
  profile: { type: Object, required: true },
  relationNodes: { type: Array, default: () => [] },
  role: { type: Object, required: true },
  roleDiaries: { type: Array, default: () => [] },
  worldEntries: { type: Array, default: () => [] }
});

defineEmits(['back', 'settings', 'open-section']);

const branchItems = computed(() => [
  {
    id: 'archive',
    title: '档案',
    icon: 'ph ph-identification-card',
    summary: props.archiveText || '整理人设、标签、立绘和图库',
    meta: `${props.profile.gallery?.length || 0} 图`
  },
  {
    id: 'world',
    title: '世界书',
    icon: 'ph ph-book-open-text',
    summary: '查看与角色命中的世界设定',
    meta: `${props.worldEntries.length} 条`
  },
  {
    id: 'memory',
    title: '记忆空间',
    icon: 'ph ph-note-pencil',
    summary: '心声、收藏、日记和长期记忆',
    meta: `${props.memoryCount} 张`
  },
  {
    id: 'relations',
    title: '关系网',
    icon: 'ph ph-graph',
    summary: '整理角色与重要人物的连接',
    meta: `${props.relationNodes.length} 人`
  }
]);
</script>

<style scoped>
.char-home-dashboard {
  min-height: var(--vvh, 100dvh);
  color: var(--char-text);
  overflow-x: hidden;
}

.home-cover {
  position: relative;
  min-height: 72vh;
  padding-top: env(safe-area-inset-top);
  background:
    linear-gradient(135deg, rgba(75, 60, 48, 0.2), rgba(255, 255, 255, 0.3)),
    var(--char-surface-muted);
  background-size: cover;
  background-position: center;
}

.home-toolbar {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  padding: 16px 18px;
}

.home-toolbar button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  color: var(--char-text);
  background: var(--char-surface);
  box-shadow: 0 8px 20px var(--char-shadow);
}

.cover-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.62) 100%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.38), transparent 42%);
}

.home-title {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 118px;
  z-index: 2;
  color: #fff;
}

.home-title span {
  display: inline-block;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.home-title h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.08;
}

.home-title p {
  margin: 12px 0 0;
  max-width: 34em;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  line-height: 1.65;
}

.branch-panel {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: -92px 18px 0;
  border: 1px solid var(--char-border-soft);
  border-radius: 28px;
  padding: 10px;
  background: linear-gradient(180deg, var(--char-surface) 0%, rgba(255, 255, 255, 0.74) 100%);
  box-shadow: 0 18px 34px var(--char-shadow);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.branch-card {
  min-height: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 0;
  border-radius: 20px;
  padding: 8px 4px;
  color: var(--char-text);
  background: transparent;
  text-align: center;
}

.branch-card i {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-size: 20px;
}

.branch-card strong,
.branch-card small {
  display: block;
}

.branch-card strong {
  color: var(--char-text-strong);
  font-size: 13px;
  line-height: 1.2;
}

.branch-card small {
  display: none;
}

.branch-card em {
  border-radius: 999px;
  padding: 3px 8px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
}

@media (max-width: 360px) {
  .branch-panel {
    gap: 4px;
    margin-left: 12px;
    margin-right: 12px;
    padding: 8px;
  }

  .home-title h1 {
    font-size: 30px;
  }
}
</style>
