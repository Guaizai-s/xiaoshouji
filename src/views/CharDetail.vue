<template>
  <div class="char-page" :class="currentTheme">
    <template v-if="selectedRole">
      <header class="detail-hero" :style="coverStyle(selectedRole)">
        <div class="hero-toolbar">
          <button aria-label="返回" @click="goHome"><i class="ph ph-caret-left"></i></button>
          <button aria-label="聊天设置" @click="openSettings"><i class="ph ph-dots-three"></i></button>
        </div>
        <div class="detail-hero-shade"></div>
        <div class="detail-title">
          <h1>{{ selectedRole.name || '未命名角色' }}</h1>
          <p>{{ roleSummary(selectedRole, 80) }}</p>
        </div>
      </header>

      <main class="detail-body">
        <nav class="detail-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </nav>

        <section v-if="activeTab === 'archive'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-title-row">
              <h2>人设</h2>
              <button @click="startProfileEdit">编辑摘要/标签</button>
            </div>
            <p class="profile-summary">{{ archiveText }}</p>
            <div v-if="visibleTags.length" class="tag-row">
              <span v-for="tag in visibleTags" :key="tag">{{ tag }}</span>
            </div>
          </div>

          <div v-if="profileEditing" class="panel-card edit-card">
            <label>
              <span>短简介</span>
              <input v-model="profileDraft.shortBio" placeholder="一句话概括角色" />
            </label>
            <label>
              <span>摘要</span>
              <textarea v-model="profileDraft.summary" rows="4" placeholder="手写角色简介，不会自动从提示词编造资料"></textarea>
            </label>
            <label>
              <span>职业/身份</span>
              <input v-model="profileDraft.profession" placeholder="如：学生" />
            </label>
            <label>
              <span>标签</span>
              <input v-model="profileDraft.tagsText" placeholder="逗号分隔，如：冷静，危险，可靠" />
            </label>
            <label>
              <span>喜好</span>
              <input v-model="profileDraft.likesText" placeholder="逗号分隔" />
            </label>
            <label>
              <span>厌恶</span>
              <input v-model="profileDraft.dislikesText" placeholder="逗号分隔" />
            </label>
            <div class="edit-actions">
              <button class="ghost" @click="profileEditing = false">取消</button>
              <button @click="saveProfileDraft">保存</button>
            </div>
          </div>

          <div class="section-heading">
            <h2>立绘</h2>
            <button @click="coverInput?.click()">上传立绘</button>
            <input ref="coverInput" type="file" accept="image/*" class="hidden-input" @change="onCoverUpload" />
          </div>
          <div class="portrait-frame" :style="coverStyle(selectedRole)"></div>

          <div class="section-heading">
            <h2>更多图片</h2>
            <button @click="galleryInput?.click()">添加图片</button>
            <input ref="galleryInput" type="file" accept="image/*" multiple class="hidden-input" @change="onGalleryUpload" />
          </div>
          <div v-if="profile.gallery.length" class="gallery-row">
            <img v-for="(img, index) in profile.gallery" :key="`${index}-${img.slice(0, 24)}`" :src="img" alt="" />
          </div>
          <div v-else class="soft-empty">还没有更多图片。</div>
        </section>

        <section v-else-if="activeTab === 'world'" class="tab-panel">
          <div class="section-heading">
            <h2>关联的世界书</h2>
            <small>{{ matchedWorldEntries.length }} 条</small>
          </div>
          <div v-if="matchedWorldEntries.length" class="world-list">
            <article v-for="entry in matchedWorldEntries" :key="entry.id" class="compact-card">
              <h3>{{ entry.title }}</h3>
              <p>{{ clip(entry.content, 96) }}</p>
              <small>{{ entry.triggerType === 'keyword' ? entryKeywords(entry) : '常驻条目' }}</small>
            </article>
          </div>
          <div v-else class="soft-empty">还没有命中这个角色的世界书条目。</div>
        </section>

        <section v-else-if="activeTab === 'memory'" class="tab-panel memory-space-panel">
          <div class="memory-overview">
            <div>
              <span>Memory Space</span>
              <h2>{{ memoryCount }} 条收藏</h2>
            </div>
            <small>心声 / 语音 / 聊天片段</small>
          </div>

          <div class="section-heading">
            <h2>保存的心声</h2>
            <small>共 {{ savedHeartVoices.length }} 条</small>
          </div>
          <div v-if="savedHeartVoices.length" class="heart-memory-list">
            <article v-for="item in savedHeartVoices" :key="item.id" class="heart-memory-card">
              <div class="memory-card-head">
                <strong>{{ item.title || '心声' }}</strong>
                <time>{{ formatDate(item.createdAt) }}</time>
              </div>
              <div class="heart-memory-fields">
                <p v-for="field in heartVoiceFieldsFor(item)" :key="`${item.id}-${field.key}`">
                  <span>{{ field.label }}</span>{{ field.value }}
                </p>
              </div>
            </article>
          </div>
          <div v-else class="soft-empty">还没有保存的心声。打开聊天里的心声面板，点保存就会来到这里。</div>

          <div class="section-heading">
            <h2>收藏的聊天</h2>
            <small>共 {{ favoriteMessages.length }} 条</small>
          </div>
          <div v-if="favoriteMessages.length" class="favorite-memory-list">
            <article v-for="msg in favoriteMessages" :key="msg.id" class="favorite-memory-card">
              <div class="memory-card-head">
                <strong>{{ msg.role === 'user' ? '你' : selectedRole.name }}</strong>
                <time>{{ formatDate(msg.favoriteAt || msg.timestamp) }}</time>
              </div>
              <button v-if="msg.audioUrl" class="memory-audio-btn" :class="{ playing: currentMemoryAudioId === msg.id }" @click="toggleMemoryAudio(msg)">
                <i :class="currentMemoryAudioId === msg.id ? 'ph-fill ph-pause-circle' : 'ph-fill ph-play-circle'"></i>
                <span>{{ currentMemoryAudioId === msg.id ? '正在播放' : '播放语音' }}</span>
              </button>
              <p class="favorite-memory-text">{{ messageMemoryText(msg) }}</p>
            </article>
          </div>
          <div v-else class="soft-empty">长按聊天或语音消息收藏后，会自动出现在这里。</div>

          <template v-if="false">
          <div class="section-heading">
            <h2>收藏的聊天记录</h2>
            <small>共 {{ favoriteMessages.length }} 条</small>
          </div>
          <div class="memory-card">
            <template v-if="recentMessages.length">
              <p v-for="msg in recentMessages" :key="msg.id">
                <strong>{{ msg.role === 'user' ? '你' : selectedRole.name }}：</strong>{{ clip(msg.content, 48) }}
                <time>{{ formatDate(msg.timestamp) }}</time>
              </p>
            </template>
            <p v-else class="muted">还没有聊天记录。</p>
          </div>

          <div class="section-heading">
            <h2>保存的心声</h2>
            <small>共 {{ roleDiaries.length }} 条</small>
          </div>
          <div class="memory-card">
            <template v-if="roleDiaries.length">
              <p v-for="diary in roleDiaries.slice(0, 3)" :key="diary.id">
                <strong>{{ diary.title }}</strong>{{ clip(diary.summary || diary.content, 56) }}
                <time>{{ diary.dateKey }}</time>
              </p>
            </template>
            <p v-else class="muted">暂无角色日记或心声。</p>
          </div>

          </template>
          <div class="section-heading">
            <h2>长期与核心记忆</h2>
          </div>
          <div class="memory-card bullet-card">
            <p v-if="coreMemory">• {{ clip(coreMemory, 80) }}</p>
            <p v-if="longTermMemory">• {{ clip(longTermMemory, 80) }}</p>
            <p v-if="!coreMemory && !longTermMemory" class="muted">还没有写入核心记忆或长期记忆。</p>
          </div>
        </section>

        <section v-else class="tab-panel relation-panel">
          <div class="relation-map">
            <div class="center-node">
              <img :src="selectedRole.avatar || defaultAvatar" alt="" />
              <strong>{{ selectedRole.name || '角色' }}</strong>
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
        </section>
      </main>
    </template>

    <main v-else class="empty-state">
      <h2>{{ loading ? '正在加载角色' : '角色不存在' }}</h2>
      <button v-if="!loading" @click="goHome">返回角色中心</button>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  conversationService,
  diaryService,
  messageService,
  roleService,
  worldBookEntryService
} from '../services/db';
import {
  clip,
  coverStyle,
  defaultAvatar,
  defaultUserAvatar,
  formatDate,
  HEART_VOICE_FIELDS,
  normalizeProfile,
  promptSnippet,
  roleSummary,
  splitList
} from '../composables/useCharProfile';
import { useSystemTheme } from '../composables/useSystemTheme';

const route = useRoute();
const router = useRouter();
const { currentTheme } = useSystemTheme();

const roles = ref([]);
const worldEntries = ref([]);
const roleMessages = ref([]);
const roleDiaries = ref([]);
const activeTab = ref('archive');
const profileEditing = ref(false);
const coverInput = ref(null);
const galleryInput = ref(null);
const userAvatar = ref(defaultUserAvatar);
const loading = ref(true);
const currentMemoryAudioId = ref(null);
const profileDraft = ref({
  summary: '',
  shortBio: '',
  profession: '',
  tagsText: '',
  likesText: '',
  dislikesText: ''
});

const tabs = [
  { id: 'archive', label: '角色档案', icon: 'ph ph-identification-card' },
  { id: 'world', label: '世界书', icon: 'ph ph-book-open-text' },
  { id: 'memory', label: '记忆空间', icon: 'ph ph-archive-box' },
  { id: 'relations', label: '关系网', icon: 'ph ph-graph' }
];

const currentRoleId = computed(() => Number(route.params.id));
const selectedRole = computed(() => roles.value.find(role => role.id === currentRoleId.value) || null);
const profile = computed(() => normalizeProfile(selectedRole.value?.profile));
const visibleTags = computed(() => [
  ...profile.value.tags,
  ...profile.value.likes.map(item => `喜好：${item}`),
  ...profile.value.dislikes.map(item => `厌恶：${item}`)
]);
const archiveText = computed(() => {
  if (profile.value.summary) return profile.value.summary;
  const prompt = promptSnippet(selectedRole.value?.systemPrompt, 220);
  return prompt || '还没有手写摘要。可以先保留提示词原文，等你想整理时再补充。';
});
const coreMemory = computed(() => selectedRole.value?.chatSettings?.coreMemory || '');
const longTermMemory = computed(() => selectedRole.value?.chatSettings?.longTermMemory || '');
const recentMessages = computed(() => roleMessages.value.slice(-4).reverse());
const savedHeartVoices = computed(() => profile.value.memoryItems.filter(item => item.type === 'heart_voice'));
const favoriteMessages = computed(() => roleMessages.value
  .filter(msg => msg.isFavorite)
  .sort((a, b) => (b.favoriteAt || b.timestamp || 0) - (a.favoriteAt || a.timestamp || 0)));
const memoryCount = computed(() => savedHeartVoices.value.length + favoriteMessages.value.length);
const matchedWorldEntries = computed(() => {
  if (!selectedRole.value) return [];
  const terms = [selectedRole.value.name, ...profile.value.tags, ...profile.value.likes]
    .map(item => String(item || '').trim().toLowerCase())
    .filter(Boolean);
  if (!terms.length) return [];
  return worldEntries.value.filter(entry => {
    const haystack = [
      entry.title,
      entry.content,
      ...(entry.keywords || [])
    ].join('\n').toLowerCase();
    return terms.some(term => haystack.includes(term));
  });
});
const relationNodes = computed(() => {
  if (!selectedRole.value) return [];
  const custom = profile.value.relationships.map(rel => {
    const linked = rel.targetRoleId ? roles.value.find(role => role.id === Number(rel.targetRoleId)) : null;
    return {
      name: rel.name || linked?.name || '未命名',
      label: rel.label || '关系未设定',
      avatar: rel.avatar || linked?.avatar || defaultAvatar
    };
  });
  return custom.length ? custom : [
    { name: '你', label: '特别的人', avatar: userAvatar.value }
  ];
});

onMounted(async () => {
  loadUserAvatar();
  await loadBaseData();
  await loadDetailData();
  loading.value = false;
});

watch(() => route.params.id, async () => {
  loading.value = true;
  activeTab.value = 'archive';
  profileEditing.value = false;
  stopMemoryAudio();
  await loadBaseData();
  await loadDetailData();
  loading.value = false;
});

onUnmounted(() => {
  stopMemoryAudio();
});

const loadBaseData = async () => {
  const [allRoles, allWorldEntries] = await Promise.all([
    roleService.getAll(),
    worldBookEntryService.getAll()
  ]);
  roles.value = allRoles;
  worldEntries.value = allWorldEntries;
};

const loadDetailData = async () => {
  if (!currentRoleId.value) {
    roleMessages.value = [];
    roleDiaries.value = [];
    return;
  }
  const [messages, diaries] = await Promise.all([
    messageService.getByRoleTimeRange(currentRoleId.value, 0, Date.now() + 1000),
    diaryService.getForRole(currentRoleId.value)
  ]);
  roleMessages.value = messages;
  roleDiaries.value = diaries;
};

const loadUserAvatar = () => {
  const saved = localStorage.getItem('userProfile');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    userAvatar.value = data.avatar || defaultUserAvatar;
  } catch {
    userAvatar.value = defaultUserAvatar;
  }
};

const goHome = () => {
  router.replace('/char');
};

const openSettings = async () => {
  if (!selectedRole.value?.id) return;
  const conversation = await conversationService.getOrCreate(selectedRole.value.id);
  router.replace(`/chat-details/conv/${conversation.id}`);
};

const startProfileEdit = () => {
  profileDraft.value = {
    summary: profile.value.summary,
    shortBio: profile.value.shortBio,
    profession: profile.value.profession,
    tagsText: profile.value.tags.join('，'),
    likesText: profile.value.likes.join('，'),
    dislikesText: profile.value.dislikes.join('，')
  };
  profileEditing.value = true;
};

const saveProfileDraft = async () => {
  await saveProfile({
    summary: profileDraft.value.summary.trim(),
    shortBio: profileDraft.value.shortBio.trim(),
    profession: profileDraft.value.profession.trim(),
    tags: splitList(profileDraft.value.tagsText),
    likes: splitList(profileDraft.value.likesText),
    dislikes: splitList(profileDraft.value.dislikesText)
  });
  profileEditing.value = false;
};

const onCoverUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await saveProfile({ coverImage: await readFile(file) });
  event.target.value = '';
};

const onGalleryUpload = async (event) => {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  const images = await Promise.all(files.map(readFile));
  await saveProfile({ gallery: [...profile.value.gallery, ...images].slice(0, 12) });
  event.target.value = '';
};

const saveProfile = async (patch) => {
  if (!selectedRole.value?.id) return;
  const nextProfile = normalizeProfile({ ...profile.value, ...patch });
  const updated = await roleService.update(selectedRole.value.id, { profile: nextProfile });
  const index = roles.value.findIndex(role => role.id === updated.id);
  if (index >= 0) roles.value.splice(index, 1, updated);
};

const relationStyle = (index, total) => {
  const count = Math.max(1, total);
  const angle = (-90 + index * (360 / count)) * Math.PI / 180;
  const radius = count === 1 ? 112 : 126;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return { transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` };
};

const entryKeywords = (entry) => (entry.keywords || []).join(' / ');

let memoryAudio = null;

const stopMemoryAudio = () => {
  if (memoryAudio) {
    memoryAudio.pause();
    memoryAudio = null;
  }
  currentMemoryAudioId.value = null;
};

const toggleMemoryAudio = (message) => {
  if (!message?.audioUrl) return;
  if (currentMemoryAudioId.value === message.id && memoryAudio) {
    stopMemoryAudio();
    return;
  }
  stopMemoryAudio();
  memoryAudio = new Audio(message.audioUrl);
  currentMemoryAudioId.value = message.id;
  memoryAudio.onended = stopMemoryAudio;
  memoryAudio.play();
};

const messageMemoryText = (message) => {
  if (!message) return '';
  if (message.type === 'image') return '[图片]';
  if (message.type === 'sticker') return '[表情]';
  if (message.audioUrl) return message.content || '语音消息';
  return clip(message.content, 160);
};

const heartVoiceFieldsFor = (item) => HEART_VOICE_FIELDS
  .map(field => ({
    ...field,
    value: String(item?.data?.[field.key] || '').trim()
  }))
  .filter(field => field.value);

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
</script>

<style scoped>
.char-page {
  --char-bg-start: #faf6ef;
  --char-bg-mid: #f1ebe2;
  --char-bg-end: #f7f3ed;
  --char-body-start: #f9f5ef;
  --char-body-end: #f1ebe3;
  --char-surface: rgba(255, 255, 255, 0.72);
  --char-surface-soft: rgba(255, 255, 255, 0.62);
  --char-surface-muted: #ddd4c9;
  --char-text: #2f2925;
  --char-text-strong: #171310;
  --char-text-soft: rgba(47, 41, 37, 0.58);
  --char-text-muted: rgba(47, 41, 37, 0.42);
  --char-text-faint: rgba(47, 41, 37, 0.28);
  --char-accent: #c68b57;
  --char-accent-text: #8c623f;
  --char-accent-soft: rgba(199, 139, 86, 0.12);
  --char-border: rgba(76, 58, 44, 0.1);
  --char-border-soft: rgba(76, 58, 44, 0.08);
  --char-border-dashed: rgba(76, 58, 44, 0.16);
  --char-shadow: rgba(58, 43, 32, 0.08);
  --char-deep-shadow: rgba(58, 43, 32, 0.18);
  height: var(--vvh, 100dvh);
  color: var(--char-text);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 36%),
    linear-gradient(180deg, var(--char-bg-start) 0%, var(--char-bg-mid) 55%, var(--char-bg-end) 100%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.char-page.theme-nordic {
  --char-bg-start: #f7fbff;
  --char-bg-mid: #edf4fa;
  --char-bg-end: #f4f8fb;
  --char-body-start: #f8fbff;
  --char-body-end: #edf4fa;
  --char-surface: rgba(255, 255, 255, 0.76);
  --char-surface-soft: rgba(255, 255, 255, 0.68);
  --char-surface-muted: #dce7ef;
  --char-text: #2c3e50;
  --char-text-strong: #1d2e3d;
  --char-text-soft: rgba(44, 62, 80, 0.58);
  --char-text-muted: rgba(44, 62, 80, 0.42);
  --char-text-faint: rgba(44, 62, 80, 0.28);
  --char-accent: #6b8ea5;
  --char-accent-text: #4f748d;
  --char-accent-soft: rgba(107, 142, 165, 0.13);
  --char-border: rgba(107, 142, 165, 0.16);
  --char-border-soft: rgba(107, 142, 165, 0.12);
  --char-border-dashed: rgba(107, 142, 165, 0.22);
  --char-shadow: rgba(107, 142, 165, 0.08);
  --char-deep-shadow: rgba(44, 62, 80, 0.18);
}
.char-page.theme-data {
  --char-bg-start: #25282e;
  --char-bg-mid: #1e2024;
  --char-bg-end: #202329;
  --char-body-start: #25282e;
  --char-body-end: #1e2024;
  --char-surface: rgba(42, 45, 52, 0.76);
  --char-surface-soft: rgba(42, 45, 52, 0.68);
  --char-surface-muted: #353942;
  --char-text: #e0e6ed;
  --char-text-strong: #f5f8fb;
  --char-text-soft: rgba(224, 230, 237, 0.62);
  --char-text-muted: rgba(224, 230, 237, 0.42);
  --char-text-faint: rgba(224, 230, 237, 0.32);
  --char-accent: #40d1af;
  --char-accent-text: #6be1c5;
  --char-accent-soft: rgba(64, 209, 175, 0.13);
  --char-border: rgba(255, 255, 255, 0.08);
  --char-border-soft: rgba(255, 255, 255, 0.08);
  --char-border-dashed: rgba(255, 255, 255, 0.14);
  --char-shadow: rgba(0, 0, 0, 0.28);
  --char-deep-shadow: rgba(0, 0, 0, 0.36);
}
.detail-hero {
  position: relative;
  min-height: 42vh;
  padding-top: env(safe-area-inset-top);
  background:
    linear-gradient(135deg, rgba(75, 60, 48, 0.2), rgba(255, 255, 255, 0.36)),
    var(--char-surface-muted);
  background-size: cover;
  background-position: center;
}
.hero-toolbar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  padding: 16px 18px;
}
.hero-toolbar button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  color: var(--char-text);
  background: var(--char-surface);
  box-shadow: 0 8px 20px var(--char-shadow);
}
.detail-hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 28%, rgba(0, 0, 0, 0.64) 100%);
}
.detail-title {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 30px;
  z-index: 2;
  color: #fff;
}
.detail-title h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}
.detail-title p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 14px;
  line-height: 1.55;
}
.detail-body {
  position: relative;
  z-index: 3;
  min-height: 58vh;
  margin-top: -18px;
  padding: 22px 16px calc(56px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  background: linear-gradient(180deg, var(--char-body-start) 0%, var(--char-body-end) 100%);
}
.detail-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 22px;
}
.detail-tabs button {
  min-width: 0;
  border: none;
  border-radius: 16px;
  padding: 12px 6px;
  color: var(--char-text-soft);
  background: var(--char-surface-soft);
}
.detail-tabs i {
  display: block;
  margin-bottom: 7px;
  font-size: 22px;
}
.detail-tabs span {
  display: block;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-tabs button.active {
  color: var(--char-text-strong);
  box-shadow: inset 0 -2px 0 var(--char-accent);
}
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-card,
.compact-card,
.memory-card {
  border: 1px solid var(--char-border-soft);
  border-radius: 18px;
  background: var(--char-surface-soft);
  box-shadow: 0 12px 26px var(--char-shadow);
}
.panel-card {
  padding: 18px;
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
  font-size: 18px;
}
.panel-title-row button,
.section-heading button,
.edit-actions button,
.empty-state button {
  border: none;
  border-radius: 999px;
  color: var(--char-text);
  background: var(--char-surface);
  font-weight: 700;
}
.panel-title-row button,
.section-heading button {
  padding: 8px 12px;
  color: var(--char-accent-text);
  background: var(--char-surface);
  font-size: 12px;
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
  font-weight: 700;
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
  font-weight: 700;
}
.edit-card input,
.edit-card textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--char-border);
  border-radius: 12px;
  outline: none;
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
  min-height: 310px;
  border-radius: 18px;
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
  width: 92px;
  height: 92px;
  flex: 0 0 92px;
  border-radius: 14px;
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
.world-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.compact-card {
  padding: 15px;
}
.compact-card h3 {
  margin: 0 0 7px;
}
.compact-card p {
  margin: 0 0 8px;
  color: var(--char-text-soft);
  line-height: 1.65;
}
.compact-card small,
.section-heading small {
  color: var(--char-text-muted);
}
.memory-card {
  padding: 14px 16px;
}
.memory-card p {
  position: relative;
  margin: 0;
  padding: 10px 0;
  color: var(--char-text-soft);
  line-height: 1.6;
}
.memory-card p + p {
  border-top: 1px solid var(--char-border-soft);
}
.memory-card time {
  float: right;
  color: var(--char-text-muted);
  font-size: 12px;
}
.memory-card .muted {
  color: var(--char-text-muted);
}
.bullet-card p {
  padding: 6px 0;
}
.memory-space-panel {
  gap: 18px;
}
.memory-overview {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--char-border-soft);
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(135deg, var(--char-surface) 0%, var(--char-accent-soft) 100%);
  box-shadow: 0 12px 26px var(--char-shadow);
}
.memory-overview span {
  color: var(--char-accent-text);
  font-size: 12px;
  font-weight: 800;
}
.memory-overview h2 {
  margin: 5px 0 0;
  font-size: 24px;
}
.memory-overview small,
.memory-card-head time {
  color: var(--char-text-muted);
  font-size: 12px;
}
.heart-memory-list,
.favorite-memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.heart-memory-card,
.favorite-memory-card {
  border: 1px solid var(--char-border-soft);
  border-radius: 18px;
  padding: 15px;
  background: var(--char-surface-soft);
  box-shadow: 0 12px 26px var(--char-shadow);
}
.memory-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.memory-card-head strong {
  min-width: 0;
  color: var(--char-text-strong);
  font-size: 16px;
}
.heart-memory-fields {
  display: grid;
  gap: 8px;
}
.heart-memory-fields p,
.favorite-memory-text {
  margin: 0;
  color: var(--char-text-soft);
  font-size: 14px;
  line-height: 1.65;
}
.heart-memory-fields span {
  display: inline-block;
  margin-right: 8px;
  color: var(--char-accent-text);
  font-size: 12px;
  font-weight: 800;
}
.memory-audio-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  margin-bottom: 10px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-weight: 800;
}
.memory-audio-btn i {
  font-size: 18px;
}
.memory-audio-btn.playing {
  color: var(--char-bg-end);
  background: var(--char-accent);
}
.relation-panel {
  overflow-x: auto;
}
.relation-map {
  position: relative;
  width: 390px;
  height: 430px;
  margin: 0 auto;
}
.relation-map::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 260px;
  height: 260px;
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
  transform: translate(-50%, -50%);
  z-index: 2;
}
.center-node img {
  width: 96px;
  height: 96px;
  border: 4px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 12px 28px var(--char-deep-shadow);
}
.relation-node img {
  width: 62px;
  height: 62px;
  border: 3px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 18px var(--char-deep-shadow);
}
.relation-node strong,
.center-node strong {
  max-width: 90px;
  overflow: hidden;
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
.empty-state {
  display: grid;
  place-items: center;
  min-height: 58vh;
  padding: 30px;
  text-align: center;
}
.empty-state h2 {
  margin: 16px 0 6px;
}
.empty-state button {
  margin-top: 12px;
  padding: 12px 22px;
}

@media (max-width: 360px) {
  .detail-tabs span {
    font-size: 11px;
  }
}
</style>
