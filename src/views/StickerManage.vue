<template>
  <div class="wx-page">
    <div class="nav-bar">
      <div class="nav-back" @click="handleBack">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="nav-title">{{ currentLibrary ? currentLibrary.name : '表情包库' }}</div>
      <div class="nav-action" @click="handleAdd">+</div>
    </div>

    <!-- 表情包库列表 -->
    <div v-if="!currentLibrary" class="page-content">
      <div class="group-label">我的表情包库（{{ libraries.length }}）</div>
      <div v-if="libraries.length === 0" class="empty-hint">暂无表情包库，点击右上角 + 创建</div>
      <div v-else class="library-list">
        <div v-for="lib in libraries" :key="lib.id" class="library-item" @click="openLibrary(lib)">
          <div class="library-info">
            <div class="library-name">{{ lib.name }}</div>
            <div class="library-count">{{ getStickerCount(lib.id) }} 个表情</div>
          </div>
          <div class="library-actions" @click.stop>
            <span class="btn-del" @click="deleteLibrary(lib.id)">删除</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 表情包列表（库内） -->
    <div v-else class="page-content">
      <div class="group-label">表情包（{{ stickers.length }}）</div>
      <div v-if="stickers.length === 0" class="empty-hint">暂无表情包，点击右上角 + 上传</div>
      <div v-else class="sticker-grid">
        <div v-for="s in stickers" :key="s.id" class="sticker-item">
          <img :src="s.imageUrl" :alt="s.name" />
          <div class="sticker-name">{{ s.name }}</div>
          <div class="sticker-desc">{{ s.description }}</div>
          <div class="sticker-actions">
            <span class="btn-del" @click="deleteSticker(s.id)">删除</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建表情包库弹窗 -->
    <div v-if="showCreateLibrary" class="modal-overlay" @click="showCreateLibrary = false">
      <div class="modal-content" @click.stop>
        <div class="modal-title">创建表情包库</div>
        <div class="form-group">
          <label>库名称</label>
          <input v-model="libraryForm.name" placeholder="例如：日常表情、可爱猫猫" maxlength="20" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateLibrary = false">取消</button>
          <button class="btn-confirm" @click="saveLibrary">创建</button>
        </div>
      </div>
    </div>

    <!-- 上传表情包弹窗 -->
    <div v-if="showUpload" class="modal-overlay" @click="showUpload = false">
      <div class="modal-content" @click.stop>
        <div class="modal-title">上传表情包</div>
        <div class="form-group">
          <label>表情名称</label>
          <input v-model="form.name" placeholder="例如：亲亲、生气" maxlength="10" />
        </div>
        <div class="form-group">
          <label>表情描述</label>
          <input v-model="form.description" placeholder="描述使用场景，帮助AI理解" maxlength="30" />
        </div>
        <div class="form-group">
          <label>选择图片</label>
          <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" style="display:none" />
          <div class="upload-area" @click="$refs.fileInput.click()">
            <img v-if="form.imageUrl" :src="form.imageUrl" class="preview-img" />
            <div v-else class="upload-placeholder">点击选择图片</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showUpload = false">取消</button>
          <button class="btn-confirm" @click="saveSticker">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { stickerService, stickerLibraryService } from '../services/db';

const router = useRouter();
const libraries = ref([]);
const stickers = ref([]);
const currentLibrary = ref(null);
const showCreateLibrary = ref(false);
const showUpload = ref(false);
const fileInput = ref(null);

const libraryForm = ref({ name: '' });
const form = ref({ name: '', description: '', imageUrl: '' });

const loadLibraries = async () => {
  libraries.value = await stickerLibraryService.getAll();
};

const loadStickers = async (libraryId) => {
  stickers.value = await stickerService.getByLibrary(libraryId);
};

const getStickerCount = (libraryId) => {
  return stickers.value.filter(s => s.libraryId === libraryId).length;
};

const openLibrary = (lib) => {
  currentLibrary.value = lib;
  loadStickers(lib.id);
};

const handleBack = () => {
  if (currentLibrary.value) {
    currentLibrary.value = null;
    stickers.value = [];
  } else {
    router.back();
  }
};

const handleAdd = () => {
  if (currentLibrary.value) {
    showUpload.value = true;
  } else {
    showCreateLibrary.value = true;
  }
};

const saveLibrary = async () => {
  if (!libraryForm.value.name.trim()) {
    alert('请输入库名称');
    return;
  }
  await stickerLibraryService.create({ name: libraryForm.value.name });
  libraryForm.value = { name: '' };
  showCreateLibrary.value = false;
  await loadLibraries();
};

const deleteLibrary = async (id) => {
  if (!confirm('删除表情包库将同时删除库中所有表情包，确定删除？')) return;
  await stickerLibraryService.delete(id);
  await loadLibraries();
};

const onFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    form.value.imageUrl = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const saveSticker = async () => {
  if (!form.value.name.trim() || !form.value.imageUrl) {
    alert('请填写完整信息');
    return;
  }
  await stickerService.create({
    name: form.value.name,
    description: form.value.description,
    imageUrl: form.value.imageUrl,
    libraryId: currentLibrary.value.id
  });
  form.value = { name: '', description: '', imageUrl: '' };
  showUpload.value = false;
  await loadStickers(currentLibrary.value.id);
};

const deleteSticker = async (id) => {
  if (!confirm('确定删除此表情包？')) return;
  await stickerService.delete(id);
  await loadStickers(currentLibrary.value.id);
};

onMounted(async () => {
  await loadLibraries();
  // 预加载所有表情包用于计数
  const allStickers = await stickerService.getAll();
  stickers.value = allStickers;
});
</script>

<style scoped>
.wx-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ededed;
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 44px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 16px;
}

.nav-back {
  cursor: pointer;
  padding: 8px;
  margin-left: -8px;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17px;
  font-weight: 500;
}

.nav-action {
  margin-left: auto;
  font-size: 28px;
  cursor: pointer;
  padding: 4px 8px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.group-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 14px;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.library-item:active {
  background: #f5f5f5;
}

.library-info {
  flex: 1;
}

.library-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.library-count {
  font-size: 13px;
  color: #999;
}

.library-actions {
  display: flex;
  gap: 12px;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.sticker-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.sticker-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.sticker-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.sticker-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sticker-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-del {
  color: #ff3b30;
  font-size: 13px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 80%;
  max-width: 400px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 15px;
  box-sizing: border-box;
}

.upload-area {
  border: 2px dashed #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  color: #999;
  font-size: 14px;
}

.preview-img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: #07c160;
  color: #fff;
}
</style>
