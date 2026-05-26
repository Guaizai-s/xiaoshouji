<template>
  <div class="style-page" :class="currentTheme">
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()" aria-label="返回">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div class="nav-title">美化</div>
      <button class="nav-btn clear-top" :disabled="!hasAppliedStyle" @click="clearOverride" aria-label="清除覆盖">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>

    <div class="scroll-area">
      <section
        class="drop-zone"
        :class="{ dragging: isDragging }"
        @click="fileInput?.click()"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" class="hidden-input" type="file" accept=".css,text/css" @change="onFilePick" />
        <div class="drop-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20h16" />
            <path d="M12 4v11" />
            <path d="M7 9l5-5 5 5" />
          </svg>
        </div>
        <h2>导入 CSS 美化文件</h2>
        <p>选择一个 .css 文件，原样覆盖当前前端样式。</p>
        <button class="pick-btn" type="button">选择文件</button>
      </section>

      <div v-if="errorMsg" class="status-card error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="status-card success">{{ successMsg }}</div>

      <section v-if="fileMeta.name" class="info-card">
        <div class="info-main">
          <div class="file-icon">CSS</div>
          <div class="file-text">
            <strong>{{ fileMeta.name }}</strong>
            <span>{{ fileMeta.size }} · {{ fileMeta.lines }} 行</span>
          </div>
        </div>
        <span class="state-pill" :class="{ active: hasAppliedStyle }">{{ hasAppliedStyle ? '已覆盖' : '待应用' }}</span>
      </section>

      <section v-if="cssText" class="action-card">
        <button class="action-btn primary" @click="applyOverride">应用覆盖</button>
        <button class="action-btn" @click="resetImport">重新导入</button>
        <button class="action-btn danger" :disabled="!hasAppliedStyle" @click="clearOverride">清除覆盖</button>
      </section>

      <section v-if="cssText" class="preview-card">
        <div class="preview-header">
          <span>CSS 预览</span>
          <small>{{ cssText.length }} 字符</small>
        </div>
        <pre><code>{{ cssText }}</code></pre>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { SYSTEM_THEME_KEY, initializeTheme } from '../utils/themeSync';

const STYLE_TAG_ID = 'xiaoshouji-custom-css-preview';
const MAX_CSS_SIZE = 300 * 1024;

const router = useRouter();
const currentTheme = ref(initializeTheme().systemTheme || 'theme-minimal');
const fileInput = ref(null);
const cssText = ref('');
const fileMeta = ref({ name: '', size: '', lines: 0 });
const errorMsg = ref('');
const successMsg = ref('');
const isDragging = ref(false);
const appliedVersion = ref(0);

const hasAppliedStyle = computed(() => appliedVersion.value > 0 && !!document.getElementById(STYLE_TAG_ID));

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const setError = (message) => {
  errorMsg.value = message;
  successMsg.value = '';
};

const setSuccess = (message) => {
  successMsg.value = message;
  errorMsg.value = '';
};

const validateFile = (file) => {
  if (!file) throw new Error('没有选择文件');
  const isCssName = file.name.toLowerCase().endsWith('.css');
  if (!isCssName) throw new Error('请选择 .css 文件');
  if (file.size === 0) throw new Error('CSS 文件为空');
  if (file.size > MAX_CSS_SIZE) throw new Error('CSS 文件不能超过 300KB');
};

const readCssFile = async (file) => {
  validateFile(file);
  const text = await file.text();
  if (!text.trim()) throw new Error('CSS 文件为空');
  cssText.value = text;
  fileMeta.value = {
    name: file.name,
    size: formatSize(file.size),
    lines: text.split(/\r\n|\r|\n/).length
  };
  setSuccess('文件已读取，可以应用覆盖');
};

const onFilePick = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    await readCssFile(file);
  } catch (error) {
    setError(error.message || '读取 CSS 失败');
  }
};

const onDrop = async (event) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  try {
    await readCssFile(file);
  } catch (error) {
    setError(error.message || '读取 CSS 失败');
  }
};

const applyOverride = () => {
  if (!cssText.value.trim()) {
    setError('没有可应用的 CSS');
    return;
  }
  let styleEl = document.getElementById(STYLE_TAG_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_TAG_ID;
    styleEl.setAttribute('data-source', 'style-import-preview');
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText.value;
  appliedVersion.value += 1;
  setSuccess('美化 CSS 已覆盖当前前端');
};

const clearOverride = () => {
  document.getElementById(STYLE_TAG_ID)?.remove();
  appliedVersion.value = 0;
  setSuccess('已清除美化覆盖');
};

const resetImport = () => {
  cssText.value = '';
  fileMeta.value = { name: '', size: '', lines: 0 };
  errorMsg.value = '';
  successMsg.value = '';
  fileInput.value?.click();
};

const handleThemeChange = (event) => {
  currentTheme.value = event.detail?.systemTheme || localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
};

onMounted(() => {
  appliedVersion.value = document.getElementById(STYLE_TAG_ID) ? 1 : 0;
  window.addEventListener('xiaoshouji-theme-change', handleThemeChange);
});

onUnmounted(() => {
  window.removeEventListener('xiaoshouji-theme-change', handleThemeChange);
});
</script>

<style scoped>
.style-page {
  --sys-bg: #f5f4ed;
  --card-bg: #faf9f5;
  --text-main: #5c504d;
  --text-sub: #9e938f;
  --accent: #d97757;
  --accent-soft: rgba(217, 119, 87, 0.11);
  --border: rgba(0, 0, 0, 0.06);
  --shadow: rgba(217, 119, 87, 0.1);
  --danger: #ff3b30;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--sys-bg);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}

.style-page.theme-nordic {
  --sys-bg: #f0f4f8;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-sub: #7f8c8d;
  --accent: #6b8ea5;
  --accent-soft: rgba(107, 142, 165, 0.13);
  --border: rgba(107, 142, 165, 0.15);
  --shadow: rgba(107, 142, 165, 0.1);
}

.style-page.theme-data {
  --sys-bg: #1e2024;
  --card-bg: #2a2d34;
  --text-main: #e0e6ed;
  --text-sub: #8892b0;
  --accent: #40d1af;
  --accent-soft: rgba(64, 209, 175, 0.12);
  --border: rgba(255, 255, 255, 0.08);
  --shadow: rgba(0, 0, 0, 0.3);
  --danger: #ff6b6b;
}

.nav-bar {
  min-height: 58px;
  padding: env(safe-area-inset-top) 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.nav-title {
  font-size: 18px;
  font-weight: 800;
}

.nav-btn {
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  color: var(--accent);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.28;
}

.nav-btn svg {
  width: 24px;
  height: 24px;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 34px;
}

.scroll-area::-webkit-scrollbar {
  display: none;
}

.drop-zone {
  border: 1.5px dashed var(--accent);
  border-radius: 24px;
  background: var(--accent-soft);
  padding: 28px 18px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}

.drop-zone.dragging {
  transform: scale(0.99);
  background: var(--card-bg);
}

.drop-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 18px;
  background: var(--card-bg);
  display: grid;
  place-items: center;
  color: var(--accent);
  box-shadow: 0 10px 24px var(--shadow);
}

.drop-icon svg {
  width: 30px;
  height: 30px;
}

.drop-zone h2 {
  margin: 0;
  font-size: 21px;
}

.drop-zone p {
  margin: 8px 0 18px;
  color: var(--text-sub);
  font-size: 14px;
}

.pick-btn,
.action-btn {
  border: 0;
  border-radius: 16px;
  padding: 12px 16px;
  color: var(--text-main);
  background: var(--card-bg);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.pick-btn {
  color: var(--accent);
}

.hidden-input {
  display: none;
}

.status-card,
.info-card,
.action-card,
.preview-card {
  margin-top: 16px;
  border-radius: 20px;
  background: var(--card-bg);
  box-shadow: 0 8px 22px var(--shadow);
  border: 1px solid var(--border);
}

.status-card {
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 700;
}

.status-card.error {
  color: var(--danger);
}

.status-card.success {
  color: var(--accent);
}

.info-card {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.info-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
}

.file-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-text strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.file-text span {
  color: var(--text-sub);
  font-size: 12px;
}

.state-pill {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--accent-soft);
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 800;
}

.state-pill.active {
  color: var(--accent);
}

.action-card {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.action-btn {
  background: var(--accent-soft);
  color: var(--accent);
}

.action-btn.primary {
  background: var(--accent);
  color: #fff;
}

.action-btn.danger {
  color: var(--danger);
}

.action-btn:disabled {
  opacity: 0.35;
}

.preview-card {
  overflow: hidden;
}

.preview-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  color: var(--text-main);
  font-weight: 800;
}

.preview-header small {
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 600;
}

pre {
  margin: 0;
  max-height: 44vh;
  overflow: auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-main);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.theme-data pre {
  background: rgba(255, 255, 255, 0.05);
}

@media (max-width: 360px) {
  .action-card {
    grid-template-columns: 1fr;
  }
}
</style>
