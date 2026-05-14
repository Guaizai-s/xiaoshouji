<template>
  <div v-if="visible" class="heart-voice-mask" @click.self="$emit('close')">
    <div class="heart-voice-panel" :class="variantClass">
      <div class="heart-voice-header">
        <div>
          <div class="heart-voice-kicker">{{ roleName || '角色' }}</div>
          <h2>心声</h2>
        </div>
        <div class="heart-voice-actions">
          <button
            v-if="canSave"
            class="heart-voice-save"
            :class="{ saved }"
            :disabled="saving || saved"
            @click="$emit('save')"
          >
            <i :class="saved ? 'ph-fill ph-heart' : 'ph ph-heart'"></i>
            <span>{{ saved ? '已保存' : (saving ? '保存中' : '保存') }}</span>
          </button>
          <button class="heart-voice-close" @click="$emit('close')">×</button>
        </div>
      </div>

      <div v-if="loading" class="heart-voice-loading">
        <span></span>
        <p>正在靠近一点点内心...</p>
      </div>

      <div v-else-if="error" class="heart-voice-error">
        <p>{{ error }}</p>
        <button @click="$emit('retry')">重试</button>
      </div>

      <div v-else class="heart-voice-content">
        <section
          v-for="section in visibleSections"
          :key="section.key"
          class="heart-voice-section"
          :class="{ optional: section.optional }"
        >
          <div class="section-title">
            <i :class="section.icon"></i>
            <span>{{ section.label }}</span>
          </div>
          <p>{{ section.value }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  roleName: { type: String, default: '' },
  data: { type: Object, default: null },
  variant: { type: String, default: 'wechat' },
  saved: { type: Boolean, default: false },
  saving: { type: Boolean, default: false }
});

defineEmits(['close', 'retry', 'save']);

const sectionMeta = [
  { key: 'currentStatus', label: '当前状态', icon: 'ph ph-pulse' },
  { key: 'currentThought', label: '当前想法', icon: 'ph ph-brain' },
  { key: 'desiredAction', label: '想做的事', icon: 'ph ph-paper-plane-tilt' },
  { key: 'affection', label: '好感度', icon: 'ph ph-heart' },
  { key: 'emotion', label: '情绪', icon: 'ph ph-smiley' },
  { key: 'observation', label: '观察', icon: 'ph ph-eye', optional: true },
  { key: 'innerConflict', label: '内心矛盾', icon: 'ph ph-arrows-left-right', optional: true },
  { key: 'secret', label: '秘密', icon: 'ph ph-lock-key', optional: true }
];

const visibleSections = computed(() => {
  const data = props.data || {};
  return sectionMeta
    .map(section => ({
      ...section,
      value: String(data[section.key] ?? '').trim()
    }))
    .filter(section => section.value);
});

const variantClass = computed(() => `heart-voice-${props.variant}`);
const canSave = computed(() => !props.loading && !props.error && visibleSections.value.length > 0);
</script>

<style scoped>
.heart-voice-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 18px 14px calc(18px + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.heart-voice-panel {
  width: min(100%, 520px);
  max-height: min(78vh, 680px);
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
  animation: heart-panel-in 0.28s ease both;
}

.heart-voice-wechat {
  background: rgba(255, 255, 255, 0.96);
  color: #111;
}

.heart-voice-sms {
  background: rgba(255, 255, 255, 0.9);
  color: #151515;
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.heart-voice-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
}

.heart-voice-kicker {
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.48);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.heart-voice-header h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.15;
  letter-spacing: 0;
}

.heart-voice-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.heart-voice-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
  font-size: 22px;
  line-height: 1;
}

.heart-voice-save {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  border: none;
  border-radius: 999px;
  padding: 0 11px;
  background: rgba(0, 0, 0, 0.07);
  color: inherit;
  font-size: 13px;
  font-weight: 700;
}

.heart-voice-save.saved {
  background: rgba(217, 119, 87, 0.14);
  color: #c95f42;
}

.heart-voice-save:disabled {
  opacity: 0.72;
}

.heart-voice-content {
  max-height: calc(min(78vh, 680px) - 76px);
  overflow-y: auto;
  padding: 0 14px 16px;
}

.heart-voice-section {
  padding: 14px 14px 15px;
  margin: 8px 0;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
}

.heart-voice-section.optional {
  background: rgba(245, 245, 245, 0.74);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.52);
  font-size: 12px;
  font-weight: 700;
}

.section-title i {
  font-size: 15px;
}

.heart-voice-section p {
  margin: 0;
  color: inherit;
  font-size: 15px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.heart-voice-loading,
.heart-voice-error {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px;
  color: rgba(0, 0, 0, 0.56);
  text-align: center;
  font-size: 14px;
}

.heart-voice-loading span {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 0, 0, 0.12);
  border-top-color: rgba(0, 0, 0, 0.58);
  border-radius: 999px;
  animation: heart-spin 0.85s linear infinite;
}

.heart-voice-error button {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: #111;
  color: #fff;
  font-size: 14px;
}

:global([data-theme="dark"]) .heart-voice-wechat,
.heart-voice-sms.theme-midnight {
  background: rgba(41, 42, 38, 0.96);
  color: #f3eee5;
}

:global([data-theme="dark"]) .heart-voice-kicker,
.heart-voice-sms.theme-midnight .heart-voice-kicker,
:global([data-theme="dark"]) .section-title,
.heart-voice-sms.theme-midnight .section-title,
:global([data-theme="dark"]) .heart-voice-loading,
.heart-voice-sms.theme-midnight .heart-voice-loading,
:global([data-theme="dark"]) .heart-voice-error,
.heart-voice-sms.theme-midnight .heart-voice-error {
  color: rgba(243, 238, 229, 0.62);
}

:global([data-theme="dark"]) .heart-voice-close,
:global([data-theme="dark"]) .heart-voice-save,
.heart-voice-sms.theme-midnight .heart-voice-close,
.heart-voice-sms.theme-midnight .heart-voice-save {
  background: rgba(255, 255, 255, 0.1);
}

:global([data-theme="dark"]) .heart-voice-save.saved,
.heart-voice-sms.theme-midnight .heart-voice-save.saved {
  color: #ffd3c4;
  background: rgba(255, 211, 196, 0.12);
}

:global([data-theme="dark"]) .heart-voice-section,
.heart-voice-sms.theme-midnight .heart-voice-section {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
}

.heart-voice-sms.theme-midnight .heart-voice-error button,
:global([data-theme="dark"]) .heart-voice-error button {
  background: #d8d0c2;
  color: #20211f;
}

@keyframes heart-panel-in {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes heart-spin {
  to { transform: rotate(360deg); }
}
</style>
