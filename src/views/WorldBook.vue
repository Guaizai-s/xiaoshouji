<template>
  <div class="page" :class="currentTheme">
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()" aria-label="返回">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div class="nav-title">世界书</div>
      <button class="nav-btn" @click="openEditor(null)" aria-label="新增">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>

    <div class="search-section">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="searchQuery" type="text" placeholder="搜索标题、内容或触发词..." />
      </div>
      <div class="tool-row">
        <span class="stats-text">已启用 {{ activeCount }} / {{ entries.length }} 条设定</span>
        <div class="tool-actions">
          <button @click="triggerImport">导入 JSON</button>
          <button @click="exportJson">导出</button>
          <input ref="importInput" class="hidden-input" type="file" accept="application/json,.json" @change="importJson" />
        </div>
      </div>
    </div>

    <div class="scroll-area">
      <div v-if="filteredEntries.length === 0" class="empty-state">
        <div class="empty-title">暂无世界设定</div>
        <div class="empty-sub">新增 always 或 keyword 条目后，会在模型上下文中自动注入。</div>
      </div>

      <div
        v-for="(entry, index) in filteredEntries"
        :key="entry.id"
        class="entry-card animate-enter"
        :style="{ '--delay': `${index * 0.04}s` }"
        @click="openEditor(entry)"
      >
        <div class="card-header">
          <div class="title-wrap">
            <h3 class="entry-title">{{ entry.title }}</h3>
            <span class="meta">{{ entry.triggerType === 'always' ? '始终触发' : '关键词触发' }} · P{{ entry.priority }}</span>
          </div>
          <div class="switch-wrapper" @click.stop>
            <input type="checkbox" v-model="entry.enabled" class="wx-switch" @change="toggleEntry(entry)" />
          </div>
        </div>

        <div v-if="entry.triggerType === 'keyword'" class="keyword-tags">
          <span v-for="kw in entry.keywords" :key="kw" class="tag"># {{ kw }}</span>
        </div>

        <p class="entry-preview">{{ entry.content }}</p>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="showEditor" class="drawer-overlay" @click.self="closeEditor">
        <div class="drawer-content">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <h3>{{ editingId ? '编辑世界设定' : '新增设定' }}</h3>
            <button v-if="editingId" class="delete-btn" @click="deleteEntry">删除</button>
          </div>

          <div class="form-row">
            <label>标题</label>
            <input v-model="editorForm.title" class="form-input" placeholder="如：基础设定" />
          </div>

          <div class="split-row">
            <div class="form-row">
              <label>触发类型</label>
              <select v-model="editorForm.triggerType" class="form-input">
                <option value="always">始终触发</option>
                <option value="keyword">关键词触发</option>
              </select>
            </div>
            <div class="form-row">
              <label>优先级</label>
              <input v-model.number="editorForm.priority" class="form-input" type="number" inputmode="numeric" />
            </div>
          </div>

          <div v-if="editorForm.triggerType === 'keyword'" class="form-row">
            <label>关键词 <span>逗号分隔</span></label>
            <input v-model="editorForm.keywordsStr" class="form-input" placeholder="如：角色名，魔法剑" />
          </div>

          <div class="form-row grow">
            <label>设定内容 <span>{{ editorForm.content.length }} 字</span></label>
            <textarea v-model="editorForm.content" class="form-textarea" placeholder="这里写最终要注入给模型的设定文本..." />
          </div>

          <button class="save-btn" @click="saveEntry">保存设定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { worldBookEntryService } from '../services/db';
import { SYSTEM_THEME_KEY, initializeTheme } from '../utils/themeSync';

const router = useRouter();
const currentTheme = ref(initializeTheme().systemTheme || 'theme-minimal');
const entries = ref([]);
const searchQuery = ref('');
const importInput = ref(null);
const showEditor = ref(false);
const editingId = ref(null);
const editorForm = ref({
  title: '',
  enabled: true,
  triggerType: 'always',
  keywordsStr: '',
  content: '',
  priority: 50,
  position: 'after_system'
});

const activeCount = computed(() => entries.value.filter(entry => entry.enabled !== false).length);

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return entries.value;
  return entries.value.filter(entry => {
    return entry.title.toLowerCase().includes(query)
      || entry.content.toLowerCase().includes(query)
      || (entry.keywords || []).some(keyword => keyword.toLowerCase().includes(query));
  });
});

const loadEntries = async () => {
  entries.value = await worldBookEntryService.getAll();
};

const handleThemeChange = (event) => {
  currentTheme.value = event.detail?.systemTheme || localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
};

onMounted(() => {
  loadEntries();
  window.addEventListener('xiaoshouji-theme-change', handleThemeChange);
});

onUnmounted(() => {
  window.removeEventListener('xiaoshouji-theme-change', handleThemeChange);
});

const triggerImport = () => {
  importInput.value?.click();
};

const openEditor = (entry) => {
  editingId.value = entry?.id || null;
  editorForm.value = entry ? {
    title: entry.title || '',
    enabled: entry.enabled !== false,
    triggerType: entry.triggerType || 'always',
    keywordsStr: (entry.keywords || []).join(', '),
    content: entry.content || '',
    priority: entry.priority ?? 50,
    position: entry.position || 'after_system'
  } : {
    title: '',
    enabled: true,
    triggerType: 'always',
    keywordsStr: '',
    content: '',
    priority: 50,
    position: 'after_system'
  };
  showEditor.value = true;
};

const closeEditor = () => {
  showEditor.value = false;
};

const buildPayload = () => ({
  title: editorForm.value.title,
  enabled: editorForm.value.enabled,
  triggerType: editorForm.value.triggerType,
  keywords: editorForm.value.keywordsStr.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
  content: editorForm.value.content,
  priority: editorForm.value.priority,
  position: editorForm.value.position
});

const saveEntry = async () => {
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await worldBookEntryService.update(editingId.value, payload);
    } else {
      await worldBookEntryService.create(payload);
    }
    await loadEntries();
    closeEditor();
  } catch (error) {
    alert(error.message);
  }
};

const toggleEntry = async (entry) => {
  await worldBookEntryService.update(entry.id, { enabled: entry.enabled });
  await loadEntries();
};

const deleteEntry = async () => {
  if (!editingId.value || !confirm('确定删除这条世界设定吗？')) return;
  await worldBookEntryService.delete(editingId.value);
  await loadEntries();
  closeEditor();
};

const getImportEntries = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.type === 'world_book' && Array.isArray(data.entries)) return data.entries;
  throw new Error('JSON 格式不正确，请导入数组或 world_book 包装格式');
};

const importJson = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const result = await worldBookEntryService.importEntries(getImportEntries(data));
    await loadEntries();
    const skippedText = result.skipped.length ? `，跳过 ${result.skipped.length} 条` : '';
    alert(`已导入 ${result.entries.length} 条${skippedText}`);
  } catch (error) {
    alert(`导入失败：${error.message}`);
  }
};

const exportJson = async () => {
  const data = await worldBookEntryService.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `world-book-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.page {
  --sys-bg: #f5f4ed;
  --card-bg: #faf9f5;
  --text-main: #5c504d;
  --text-sub: #9e938f;
  --accent: #d97757;
  --soft-bg: rgba(0, 0, 0, 0.04);
  --accent-soft: rgba(217, 119, 87, 0.1);
  --card-border: rgba(255, 255, 255, 0.6);
  --overlay-bg: rgba(0, 0, 0, 0.3);
  --handle-bg: rgba(0, 0, 0, 0.1);
  --shadow: rgba(217, 119, 87, 0.08);
  --danger: #ff3b30;
  width: 100%;
  height: 100dvh;
  background: var(--sys-bg);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}

.page.theme-nordic {
  --sys-bg: #f0f4f8;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-sub: #7f8c8d;
  --accent: #6b8ea5;
  --soft-bg: rgba(107, 142, 165, 0.1);
  --accent-soft: rgba(107, 142, 165, 0.13);
  --card-border: rgba(107, 142, 165, 0.16);
  --shadow: rgba(107, 142, 165, 0.08);
}

.page.theme-data {
  --sys-bg: #1e2024;
  --card-bg: #2a2d34;
  --text-main: #e0e6ed;
  --text-sub: #8892b0;
  --accent: #40d1af;
  --soft-bg: rgba(255, 255, 255, 0.06);
  --accent-soft: rgba(64, 209, 175, 0.12);
  --card-border: rgba(255, 255, 255, 0.08);
  --overlay-bg: rgba(0, 0, 0, 0.52);
  --handle-bg: rgba(255, 255, 255, 0.14);
  --shadow: rgba(0, 0, 0, 0.28);
  --danger: #ff6b6b;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: env(safe-area-inset-top) 18px 10px;
  min-height: 58px;
  flex-shrink: 0;
}
.nav-btn {
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  color: var(--accent);
  display: grid;
  place-items: center;
}
.nav-btn svg { width: 24px; height: 24px; }
.nav-title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }

.search-section { padding: 8px 20px 16px; flex-shrink: 0; }
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--soft-bg);
  padding: 12px 16px;
  border-radius: 16px;
}
.search-icon { width: 20px; height: 20px; color: var(--text-sub); }
.search-bar input {
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  color: var(--text-main);
  font-size: 15px;
}
.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}
.stats-text { color: var(--text-sub); font-size: 12px; font-weight: 600; }
.tool-actions { display: flex; gap: 8px; }
.tool-actions button {
  border: 0;
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}
.hidden-input { display: none; }

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 40px;
}
.scroll-area::-webkit-scrollbar { display: none; }
.empty-state { text-align: center; margin-top: 80px; color: var(--text-sub); }
.empty-title { font-weight: 700; margin-bottom: 8px; color: var(--text-main); }
.empty-sub { font-size: 13px; line-height: 1.6; padding: 0 24px; }

.entry-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px var(--shadow);
  border: 1px solid var(--card-border);
  cursor: pointer;
}
.entry-card:active { transform: scale(0.98); }
.animate-enter {
  animation: slideUpFade 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
}
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
.card-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.title-wrap { flex: 1; min-width: 0; }
.entry-title { margin: 0; font-size: 17px; font-weight: 800; overflow-wrap: anywhere; }
.meta { display: block; margin-top: 5px; color: var(--text-sub); font-size: 12px; font-weight: 600; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
.tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 4px 10px;
  border-radius: 10px;
}
.entry-preview {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wx-switch {
  position: relative;
  width: 44px;
  height: 26px;
  appearance: none;
  background-color: var(--soft-bg);
  border-radius: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.25s;
  margin: 0;
  flex-shrink: 0;
}
.wx-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s;
}
.wx-switch:checked { background: var(--accent); }
.wx-switch:checked::after { transform: translateX(18px); }

.drawer-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
}
.drawer-content {
  width: 100%;
  max-height: 88vh;
  background: var(--sys-bg);
  border-radius: 30px 30px 0 0;
  padding: 14px 22px calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
}
.drawer-handle {
  width: 42px;
  height: 5px;
  background: var(--handle-bg);
  border-radius: 3px;
  margin: 0 auto 18px;
}
.drawer-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.drawer-header h3 { margin: 0; font-size: 20px; }
.delete-btn {
  border: 0;
  background: transparent;
  color: var(--danger);
  font-size: 15px;
  font-weight: 700;
}
.form-row { display: flex; flex-direction: column; margin-bottom: 14px; }
.split-row { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; }
.form-row label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 700;
}
.form-row label span { color: var(--text-sub); font-size: 12px; font-weight: 500; }
.form-input,
.form-textarea {
  border: 1px solid transparent;
  background: var(--card-bg);
  color: var(--text-main);
  border-radius: 16px;
  padding: 14px;
  outline: none;
  font-size: 15px;
}
.form-textarea {
  min-height: 160px;
  resize: none;
  line-height: 1.6;
}
.grow { flex: 1; min-height: 0; }
.grow .form-textarea { flex: 1; min-height: 180px; }
.save-btn {
  border: 0;
  border-radius: 20px;
  background: var(--accent);
  color: white;
  padding: 16px;
  font-size: 17px;
  font-weight: 800;
  box-shadow: 0 8px 20px var(--shadow);
}
.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
