<template>
  <div class="world-panel">
    <div class="section-heading">
      <h2>关联的世界书</h2>
      <small>{{ entries.length }} 条</small>
    </div>
    <div v-if="entries.length" class="world-list">
      <article v-for="entry in entries" :key="entry.id" class="world-card">
        <div class="world-card-head">
          <h3>{{ entry.title }}</h3>
          <span>{{ entry.triggerType === 'keyword' ? '关键词' : '常驻' }}</span>
        </div>
        <p>{{ clip(entry.content, 150) }}</p>
        <small>{{ entry.triggerType === 'keyword' ? entryKeywords(entry) : '常驻条目' }}</small>
      </article>
    </div>
    <div v-else class="soft-empty">还没有命中这个角色的世界书条目。</div>
  </div>
</template>

<script setup>
import { clip } from '../../composables/useCharProfile';

defineProps({
  entries: { type: Array, default: () => [] }
});

const entryKeywords = (entry) => (entry.keywords || []).join(' / ');
</script>

<style scoped>
.world-panel,
.world-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-heading,
.world-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2,
.world-card h3 {
  margin: 0;
  color: var(--char-text-strong);
}

.section-heading h2 {
  font-size: 18px;
}

.section-heading small,
.world-card small {
  color: var(--char-text-muted);
}

.world-card {
  border: 1px solid var(--char-border-soft);
  border-radius: 18px;
  padding: 16px;
  background: var(--char-surface-soft);
  box-shadow: 0 12px 26px var(--char-shadow);
}

.world-card h3 {
  min-width: 0;
  font-size: 17px;
}

.world-card-head span {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 5px 9px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-size: 11px;
  font-weight: 800;
}

.world-card p {
  margin: 12px 0 10px;
  color: var(--char-text-soft);
  font-size: 14px;
  line-height: 1.75;
}

.soft-empty {
  border: 1px dashed var(--char-border-dashed);
  border-radius: 16px;
  padding: 18px;
  color: var(--char-text-muted);
  text-align: center;
}
</style>
