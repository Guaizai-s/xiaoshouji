<template>
  <div class="relation-panel">
    <div class="relation-map">
      <div class="center-node">
        <img :src="role.avatar || defaultAvatar" alt="" />
        <strong>{{ role.name || '角色' }}</strong>
      </div>
      <div
        v-for="(node, index) in relationNodes"
        :key="`${node.name}-${index}`"
        class="relation-node"
        :style="relationStyle(index, relationNodes.length)"
      >
        <img :src="node.avatar || defaultAvatar" alt="" />
        <strong>{{ node.name }}</strong>
        <small>{{ node.label }}</small>
      </div>
    </div>
    <p class="relation-hint">左右滑动查看完整关系网</p>
  </div>
</template>

<script setup>
import { defaultAvatar } from '../../composables/useCharProfile';

defineProps({
  relationNodes: { type: Array, default: () => [] },
  role: { type: Object, required: true }
});

const relationStyle = (index, total) => {
  const count = Math.max(1, total);
  const angle = (-90 + index * (360 / count)) * Math.PI / 180;
  const radius = count === 1 ? 112 : 130;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return { transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` };
};
</script>

<style scoped>
.relation-panel {
  overflow-x: auto;
}

.relation-map {
  position: relative;
  width: 410px;
  height: 460px;
  margin: 0 auto;
}

.relation-map::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 276px;
  height: 276px;
  border: 1px solid var(--char-accent-soft);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.center-node,
.relation-node {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-align: center;
}

.center-node {
  z-index: 2;
  transform: translate(-50%, -50%);
}

.center-node img {
  width: 100px;
  height: 100px;
  border: 4px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 12px 28px var(--char-deep-shadow);
}

.relation-node img {
  width: 64px;
  height: 64px;
  border: 3px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 18px var(--char-deep-shadow);
}

.relation-node strong,
.center-node strong {
  max-width: 94px;
  overflow: hidden;
  color: var(--char-text-strong);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-node small {
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-size: 11px;
}

.relation-hint {
  margin: -8px 0 0;
  color: var(--char-text-muted);
  font-size: 12px;
  text-align: center;
}
</style>
