<template>
  <div class="wx-page sticker-page">
    <div class="sticker-navbar">
      <button class="nav-back" @click="handleBack" aria-label="返回">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="nav-title">{{ currentLibrary ? currentLibrary.name : '表情包库' }}</div>
      <button v-if="currentLibrary" class="nav-add" @click="openUploadSheet" aria-label="添加表情">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <div v-else class="nav-placeholder"></div>
    </div>

    <div class="sticker-content" :class="{ 'has-bottom-bar': !currentLibrary }">
      <div v-if="!currentLibrary" class="collection-grid">
        <div v-if="collections.length === 0" class="empty-state">
          <div class="empty-art">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="empty-title">还没有表情包库</div>
          <div class="empty-subtitle">新建一个库，把常用表情收起来</div>
        </div>

        <div
          v-for="collection in collections"
          v-else
          :key="collection.id"
          class="collection-item"
          @click="openLibrary(collection.raw)"
        >
          <div class="stacked-wrapper">
            <div class="stacked-bg-1">
              <img v-if="collection.previews[2]" :src="collection.previews[2]" alt="preview" />
            </div>
            <div class="stacked-bg-2">
              <img v-if="collection.previews[1]" :src="collection.previews[1]" alt="preview" />
            </div>
            <div class="stacked-top">
              <img v-if="collection.previews[0]" :src="collection.previews[0]" alt="cover" />
              <svg v-else class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          </div>
          <div class="collection-name">[{{ collection.name }}]</div>
          <div class="collection-meta">{{ collection.count }} 个表情</div>
          <button class="delete-chip" @click.stop="deleteLibrary(collection.id)">删除</button>
        </div>
      </div>

      <div v-else class="meme-grid">
        <button class="meme-add-btn" @click="openUploadSheet" aria-label="添加表情">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div v-for="sticker in stickers" :key="sticker.id" class="meme-item">
          <img :src="sticker.imageUrl" :alt="sticker.name" />
          <button class="meme-delete" @click="deleteSticker(sticker.id)">删除</button>
          <div class="meme-caption">
            <span>{{ sticker.name }}</span>
          </div>
        </div>

        <div v-if="stickers.length === 0" class="grid-empty-note">点击虚线框添加第一个表情</div>
      </div>
    </div>

    <div v-if="!currentLibrary" class="bottom-action-bar">
      <button class="add-collection-btn" @click="openCreateLibrarySheet">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" d="M12 5v14M5 12h14" />
        </svg>
        添加表情包库
      </button>
    </div>

    <teleport to="body">
      <div v-if="showUpload" class="wx-sheet-overlay" @click.self="closeSheets">
        <div class="wx-sheet" @click.stop>
          <div class="wx-sheet-handle"></div>
          <div class="wx-sheet-title">添加表情包</div>

          <div class="form-group">
            <label>表情名称</label>
            <input v-model="form.name" placeholder="例如：亲亲、生气" maxlength="10" />
          </div>

          <div class="form-group">
            <label>表情包描述</label>
            <input v-model="form.description" placeholder="描述使用场景，帮助 AI 理解" maxlength="30" />
          </div>

          <div class="form-group">
            <label>图片来源</label>
            <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" style="display: none" />
            <button class="local-upload-box" @click="triggerFileSelect">
              <img v-if="form.imageUrl" :src="form.imageUrl" alt="preview" />
              <template v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>点击从相册选择</span>
              </template>
            </button>
          </div>

          <button class="wx-primary-btn" @click="saveSticker">确认添加</button>
          <button class="wx-secondary-btn" @click="closeSheets">取消</button>
        </div>
      </div>

      <div v-if="showCreateLibrary" class="wx-sheet-overlay" @click.self="closeSheets">
        <div class="wx-sheet" @click.stop>
          <div class="wx-sheet-handle"></div>
          <div class="wx-sheet-title">新建表情包库</div>

          <div class="form-group new-library-field">
            <input v-model="libraryForm.name" placeholder="输入库名称" maxlength="20" />
          </div>

          <button class="wx-primary-btn" @click="saveLibrary">保存</button>
          <button class="wx-secondary-btn" @click="closeSheets">取消</button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { stickerService, stickerLibraryService } from '../services/db';

const router = useRouter();
const libraries = ref([]);
const allStickers = ref([]);
const stickers = ref([]);
const currentLibrary = ref(null);
const showCreateLibrary = ref(false);
const showUpload = ref(false);
const fileInput = ref(null);

const libraryForm = ref({ name: '' });
const form = ref({ name: '', description: '', imageUrl: '' });

const collections = computed(() => libraries.value.map(library => {
  const libraryStickers = allStickers.value.filter(sticker => sticker.libraryId === library.id);
  return {
    ...library,
    raw: library,
    count: libraryStickers.length,
    previews: libraryStickers.slice(0, 3).map(sticker => sticker.imageUrl)
  };
}));

const loadLibraries = async () => {
  libraries.value = await stickerLibraryService.getAll();
  allStickers.value = await stickerService.getAll();
};

const loadStickers = async (libraryId) => {
  stickers.value = await stickerService.getByLibrary(libraryId);
  allStickers.value = await stickerService.getAll();
};

const openLibrary = async (lib) => {
  currentLibrary.value = lib;
  await loadStickers(lib.id);
};

const handleBack = () => {
  if (currentLibrary.value) {
    currentLibrary.value = null;
    stickers.value = [];
    return;
  }
  router.back();
};

const openCreateLibrarySheet = () => {
  libraryForm.value = { name: '' };
  showCreateLibrary.value = true;
};

const openUploadSheet = () => {
  form.value = { name: '', description: '', imageUrl: '' };
  showUpload.value = true;
};

const closeSheets = () => {
  showCreateLibrary.value = false;
  showUpload.value = false;
};

const saveLibrary = async () => {
  if (!libraryForm.value.name.trim()) {
    alert('请输入库名称');
    return;
  }
  await stickerLibraryService.create({ name: libraryForm.value.name.trim() });
  closeSheets();
  await loadLibraries();
};

const deleteLibrary = async (id) => {
  if (!confirm('删除表情包库将同时删除库中所有表情包，确定删除？')) return;
  await stickerLibraryService.delete(id);
  await loadLibraries();
};

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const onFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    form.value.imageUrl = ev.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
};

const saveSticker = async () => {
  if (!form.value.name.trim() || !form.value.imageUrl) {
    alert('请填写完整信息');
    return;
  }
  await stickerService.create({
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    imageUrl: form.value.imageUrl,
    libraryId: currentLibrary.value.id
  });
  closeSheets();
  await loadStickers(currentLibrary.value.id);
};

const deleteSticker = async (id) => {
  if (!confirm('确定删除此表情包？')) return;
  await stickerService.delete(id);
  await loadStickers(currentLibrary.value.id);
};

onMounted(loadLibraries);
</script>

<style scoped>
.sticker-page {
  height: var(--vvh, 100dvh);
  background: var(--wx-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sticker-navbar {
  height: calc(44px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 14px 0;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--wx-border);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-sizing: border-box;
}

.nav-back,
.nav-add {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--wx-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back svg,
.nav-add svg {
  width: 21px;
  height: 21px;
}

.nav-title {
  text-align: center;
  color: var(--wx-text-primary);
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticker-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sticker-content.has-bottom-bar {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 16px;
  padding: 32px 24px;
}

.collection-item {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  color: var(--wx-text-primary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  animation: collectionPop 0.32s ease both;
}

.collection-item:active .stacked-wrapper {
  transform: scale(0.96);
}

.collection-item:hover .stacked-bg-1 {
  transform: rotate(-10deg) translate(-8px, 5px);
}

.collection-item:hover .stacked-bg-2 {
  transform: rotate(10deg) translate(8px, 5px);
}

.collection-item:hover .stacked-top {
  transform: translateY(-3px);
}

.stacked-wrapper {
  position: relative;
  width: 86px;
  height: 86px;
  transition: transform 0.18s ease;
  animation: stackFloat 3.8s ease-in-out infinite;
}

.stacked-bg-1,
.stacked-bg-2,
.stacked-top {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: var(--wx-white);
  border: 1px solid var(--wx-border);
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.stacked-bg-1 {
  background: rgba(0, 0, 0, 0.04);
  transform: rotate(-7deg) translate(-5px, 3px);
  z-index: 1;
}

.stacked-bg-2 {
  background: rgba(0, 0, 0, 0.02);
  transform: rotate(7deg) translate(5px, 3px);
  z-index: 2;
}

.stacked-top {
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--wx-shadow-soft);
}

.stacked-bg-1 img,
.stacked-bg-2 img,
.stacked-top img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.stacked-bg-1 img,
.stacked-bg-2 img {
  opacity: 0.72;
  filter: saturate(0.92);
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--wx-text-tertiary);
}

.collection-name,
.collection-meta {
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-name {
  font-size: 14px;
  font-weight: 600;
}

.collection-meta {
  margin-top: -4px;
  font-size: 12px;
  color: var(--wx-text-secondary);
}

.delete-chip {
  border: none;
  background: rgba(250, 81, 81, 0.08);
  color: #FA5151;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
}

.meme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
}

.meme-item,
.meme-add-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  box-sizing: border-box;
}

.meme-item {
  background: var(--wx-white);
  border: 1px solid var(--wx-border);
}

.meme-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meme-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 7px 6px;
  color: #fff;
  font-size: 12px;
  text-align: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.42), transparent);
}

.meme-caption span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meme-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  border-radius: 999px;
  padding: 3px 7px;
  background: rgba(0, 0, 0, 0.48);
  color: #fff;
  font-size: 11px;
}

.meme-add-btn {
  border: 1.5px dashed #D1D1D1;
  background: transparent;
  color: var(--wx-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.meme-add-btn svg {
  width: 36px;
  height: 36px;
}

.grid-empty-note {
  grid-column: 1 / -1;
  padding: 10px 0;
  text-align: center;
  color: var(--wx-text-secondary);
  font-size: 13px;
}

.bottom-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--wx-bg) 70%, rgba(245, 245, 245, 0));
  pointer-events: none;
}

.add-collection-btn {
  pointer-events: auto;
  width: 100%;
  height: 52px;
  border: 1px solid var(--wx-border);
  border-radius: 16px;
  background: var(--wx-white);
  color: var(--wx-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.add-collection-btn svg {
  width: 20px;
  height: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--wx-text-secondary);
}

.empty-art {
  width: 76px;
  height: 76px;
  border-radius: 18px;
  background: var(--wx-white);
  border: 1px solid var(--wx-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wx-text-tertiary);
  margin-bottom: 16px;
}

.empty-art svg {
  width: 34px;
  height: 34px;
}

.empty-title {
  color: var(--wx-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.empty-subtitle {
  margin-top: 6px;
  font-size: 13px;
}

.wx-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.38);
  animation: fadeIn 0.18s ease;
}

.wx-sheet {
  width: 100%;
  padding: 8px 24px calc(24px + env(safe-area-inset-bottom));
  background: #F4F4F4;
  border-radius: 20px 20px 0 0;
  box-sizing: border-box;
  animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.wx-sheet-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
}

.wx-sheet-title {
  text-align: center;
  color: var(--wx-text-primary);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 22px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin: 0 0 8px 4px;
  color: var(--wx-text-secondary);
  font-size: 13px;
}

.form-group input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--wx-border);
  border-radius: 12px;
  background: var(--wx-white);
  color: var(--wx-text-primary);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.new-library-field {
  margin-top: 20px;
}

.local-upload-box {
  width: 100%;
  height: 120px;
  border: 1.5px dashed var(--wx-border);
  border-radius: 12px;
  background: var(--wx-white);
  color: var(--wx-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}

.local-upload-box svg {
  width: 32px;
  height: 32px;
}

.local-upload-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wx-primary-btn,
.wx-secondary-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.wx-primary-btn {
  margin-top: 10px;
  background: var(--wx-green);
  color: #fff;
}

.wx-secondary-btn {
  margin-top: 12px;
  background: var(--wx-white);
  color: var(--wx-text-primary);
}

[data-theme="dark"] .sticker-navbar {
  background: rgba(31, 31, 31, 0.92);
}

[data-theme="dark"] .stacked-bg-1 {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .stacked-bg-2 {
  background: rgba(255, 255, 255, 0.03);
}

[data-theme="dark"] .bottom-action-bar {
  background: linear-gradient(to top, var(--wx-bg) 70%, rgba(17, 17, 17, 0));
}

[data-theme="dark"] .wx-sheet {
  background: #171717;
}

[data-theme="dark"] .wx-sheet-handle {
  background: rgba(255, 255, 255, 0.18);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes collectionPop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes stackFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
</style>
