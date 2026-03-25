<template>
  <div class="wx-page">
    <div class="nav-bar">
      <div class="nav-back" @click="$router.back()">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="nav-title">表情包管理</div>
      <div class="nav-action" @click="showUpload = true">+</div>
    </div>

    <div class="page-content">
      <div class="group-label">我的表情包（{{ stickers.length }}）</div>
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
import { stickerService } from '../services/db';

const stickers = ref([]);
const showUpload = ref(false);
const form = ref({ name: '', description: '', imageUrl: '' });
const fileInput = ref(null);

const loadStickers = async () => {
  stickers.value = await stickerService.getAll();
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
  if (!form.value.name.trim()) return alert('请填写表情名称');
  if (!form.value.imageUrl) return alert('请选择图片');
  await stickerService.create(form.value);
  showUpload.value = false;
  form.value = { name: '', description: '', imageUrl: '' };
  await loadStickers();
};

const deleteSticker = async (id) => {
  if (confirm('确定删除此表情包？')) {
    await stickerService.delete(id);
    await loadStickers();
  }
};

onMounted(loadStickers);
</script>

<style scoped>
.wx-page { width: 100%; height: 100dvh; background: #f2f2f7; display: flex; flex-direction: column; }
.nav-bar { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; background: #ededed; border-bottom: 1px solid #e5e5e5; }
.nav-back { display: flex; align-items: center; cursor: pointer; min-width: 60px; }
.nav-title { font-size: 17px; font-weight: 600; }
.nav-action { font-size: 24px; cursor: pointer; min-width: 60px; text-align: right; }
.page-content { flex: 1; overflow-y: auto; padding: 16px; }
.group-label { padding: 0 0 10px; font-size: 12px; color: #8e8e93; }
.empty-hint { padding: 40px 16px; text-align: center; color: #c7c7cc; }
.sticker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.sticker-item { background: #fff; border-radius: 8px; padding: 10px; text-align: center; }
.sticker-item img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; }
.sticker-name { font-size: 13px; font-weight: 500; margin-top: 6px; }
.sticker-desc { font-size: 11px; color: #999; margin-top: 2px; }
.sticker-actions { margin-top: 6px; }
.btn-del { font-size: 12px; color: #ff3b30; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 85%; background: #fff; border-radius: 12px; padding: 20px; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 14px; color: #666; margin-bottom: 6px; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 15px; }
.upload-area { width: 100%; aspect-ratio: 1; border: 2px dashed #e5e5e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.upload-placeholder { color: #999; font-size: 14px; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.modal-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-cancel, .btn-confirm { flex: 1; padding: 10px; border-radius: 6px; font-size: 16px; border: none; cursor: pointer; }
.btn-cancel { background: #f0f0f0; color: #666; }
.btn-confirm { background: #07c160; color: #fff; }
</style>
