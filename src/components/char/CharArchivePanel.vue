<template>
  <div class="archive-panel">
    <article class="paper-card profile-card">
      <div class="panel-title-row">
        <h2>人设摘要</h2>
        <button @click="startEdit">编辑</button>
      </div>
      <p class="profile-summary">{{ archiveText }}</p>
      <div v-if="visibleTags.length" class="tag-row">
        <span v-for="tag in visibleTags" :key="tag">{{ tag }}</span>
      </div>
    </article>

    <article v-if="editing" class="paper-card edit-card">
      <label>
        <span>短简介</span>
        <input v-model="draft.shortBio" placeholder="一句话概括角色" />
      </label>
      <label>
        <span>摘要</span>
        <textarea v-model="draft.summary" rows="4" placeholder="手写角色简介，不会自动从提示词编造资料"></textarea>
      </label>
      <label>
        <span>职业/身份</span>
        <input v-model="draft.profession" placeholder="如：学生" />
      </label>
      <label>
        <span>标签</span>
        <input v-model="draft.tagsText" placeholder="逗号分隔，如：冷静，危险，可爱" />
      </label>
      <label>
        <span>喜好</span>
        <input v-model="draft.likesText" placeholder="逗号分隔" />
      </label>
      <label>
        <span>厌恶</span>
        <input v-model="draft.dislikesText" placeholder="逗号分隔" />
      </label>
      <div class="edit-actions">
        <button class="ghost" @click="editing = false">取消</button>
        <button @click="saveDraft">保存</button>
      </div>
    </article>

    <div class="section-heading">
      <h2>立绘</h2>
      <button @click="coverInput?.click()">上传立绘</button>
      <input ref="coverInput" type="file" accept="image/*" class="hidden-input" @change="onCoverUpload" />
    </div>
    <div class="portrait-frame" :style="coverStyle(role)"></div>

    <div class="section-heading">
      <h2>更多图片</h2>
      <button @click="galleryInput?.click()">添加图片</button>
      <input ref="galleryInput" type="file" accept="image/*" multiple class="hidden-input" @change="onGalleryUpload" />
    </div>
    <div v-if="profile.gallery.length" class="gallery-row">
      <img v-for="(img, index) in profile.gallery" :key="`${index}-${img.slice(0, 24)}`" :src="img" alt="" />
    </div>
    <div v-else class="soft-empty">还没有更多图片。</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { coverStyle, splitList } from '../../composables/useCharProfile';

const props = defineProps({
  archiveText: { type: String, default: '' },
  profile: { type: Object, required: true },
  role: { type: Object, required: true },
  visibleTags: { type: Array, default: () => [] }
});

const emit = defineEmits(['save-profile']);

const editing = ref(false);
const coverInput = ref(null);
const galleryInput = ref(null);
const draft = ref({
  summary: '',
  shortBio: '',
  profession: '',
  tagsText: '',
  likesText: '',
  dislikesText: ''
});

const startEdit = () => {
  draft.value = {
    summary: props.profile.summary,
    shortBio: props.profile.shortBio,
    profession: props.profile.profession,
    tagsText: props.profile.tags.join('，'),
    likesText: props.profile.likes.join('，'),
    dislikesText: props.profile.dislikes.join('，')
  };
  editing.value = true;
};

const saveDraft = () => {
  emit('save-profile', {
    summary: draft.value.summary.trim(),
    shortBio: draft.value.shortBio.trim(),
    profession: draft.value.profession.trim(),
    tags: splitList(draft.value.tagsText),
    likes: splitList(draft.value.likesText),
    dislikes: splitList(draft.value.dislikesText)
  });
  editing.value = false;
};

const onCoverUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  emit('save-profile', { coverImage: await readFile(file) });
  event.target.value = '';
};

const onGalleryUpload = async (event) => {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  const images = await Promise.all(files.map(readFile));
  emit('save-profile', { gallery: [...props.profile.gallery, ...images].slice(0, 12) });
  event.target.value = '';
};

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
</script>

<style scoped>
.archive-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-card {
  border: 1px solid var(--char-border-soft);
  border-radius: 18px;
  padding: 18px;
  background: var(--char-surface-soft);
  box-shadow: 0 12px 26px var(--char-shadow);
}

.panel-title-row,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title-row h2,
.section-heading h2 {
  margin: 0;
  color: var(--char-text-strong);
  font-size: 18px;
}

.panel-title-row button,
.section-heading button,
.edit-actions button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  color: var(--char-accent-text);
  background: var(--char-surface);
  font-size: 12px;
  font-weight: 800;
}

.profile-summary {
  margin: 14px 0 0;
  color: var(--char-text-soft);
  font-size: 14px;
  line-height: 1.8;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-row span {
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-size: 12px;
  font-weight: 800;
}

.edit-card {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.edit-card label {
  display: grid;
  gap: 7px;
}

.edit-card span {
  color: var(--char-text-soft);
  font-size: 12px;
  font-weight: 800;
}

.edit-card input,
.edit-card textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--char-border);
  border-radius: 12px;
  outline: 0;
  padding: 11px 12px;
  color: var(--char-text);
  background: var(--char-surface);
  font: inherit;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-actions button {
  padding: 10px 18px;
}

.edit-actions .ghost {
  color: var(--char-text-soft);
  background: var(--char-surface-soft);
}

.portrait-frame {
  min-height: 340px;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(75, 60, 48, 0.2), rgba(255, 255, 255, 0.36)),
    var(--char-surface-muted);
  background-size: cover;
  background-position: center;
  box-shadow: 0 16px 30px var(--char-shadow);
}

.gallery-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.gallery-row img {
  width: 94px;
  height: 94px;
  flex: 0 0 94px;
  border-radius: 16px;
  object-fit: cover;
}

.hidden-input {
  display: none;
}

.soft-empty {
  border: 1px dashed var(--char-border-dashed);
  border-radius: 16px;
  padding: 18px;
  color: var(--char-text-muted);
  text-align: center;
}
</style>
