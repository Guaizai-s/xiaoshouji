<template>
  <div class="wx-page">
    <div class="nav-bar">
      <div class="nav-back" @click="goBack">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="nav-title">{{ viewTitle }}</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- ===== 主页 ===== -->
    <div v-show="currentView === 'main'" class="page-content details-home">
      <section class="hero-card">
        <div class="hero-bg"></div>
        <div class="hero-main">
          <img class="hero-avatar role-avatar" :src="role?.avatar || defaultAvatar" alt="role avatar" />
          <div class="hero-info">
            <div class="hero-name">{{ role?.name || '未知角色' }}</div>
            <div class="hero-status">
              <span class="status-dot"></span>
              {{ roleStatus }}
            </div>
          </div>
          <button class="profile-edit-btn" @click="currentView = 'roleEdit'">编辑</button>
        </div>
      </section>

      <section class="quick-grid">
        <button class="quick-card" @click="currentView = 'memory'">
          <span class="quick-title">记忆</span>
          <span class="quick-sub">长期 / 核心</span>
        </button>
        <button class="quick-card" @click="currentView = 'api'">
          <span class="quick-title">API</span>
          <span class="quick-sub">{{ selectedProfileName }}</span>
        </button>
        <button class="quick-card" @click="currentView = 'minimax'">
          <span class="quick-title">语音</span>
          <span class="quick-sub">{{ settings.minimaxVoiceId ? '已配置' : '未配置' }}</span>
        </button>
        <button class="quick-card" @click="currentView = 'stickers'">
          <span class="quick-title">表情包</span>
          <span class="quick-sub">{{ linkedLibraryName }}</span>
        </button>
      </section>

      <div class="group-label">常用设置</div>
      <div class="panel">
        <label class="list-item">
          <span class="item-label">聊天背景图</span>
          <div class="item-right">
            <span class="text-blue" @click.stop="triggerBgUpload">{{ settings.chatBackground ? '已设置' : '选择图片' }}</span>
            <span v-if="settings.chatBackground" class="text-red" @click.stop="clearBackground" style="margin-left:8px">清除</span>
          </div>
          <input ref="bgInput" type="file" accept="image/*" style="display:none" @change="onBgUpload" />
        </label>
        <label class="list-item">
          <span class="item-label">置顶聊天</span>
          <input type="checkbox" v-model="settings.isTop" class="wx-switch" />
        </label>
        <label class="list-item">
          <span class="item-label">消息免打扰</span>
          <input type="checkbox" v-model="settings.isMuted" class="wx-switch" />
        </label>
        <label class="list-item">
          <span class="item-label">真实时间感知</span>
          <input type="checkbox" v-model="settings.isRealTimeOn" class="wx-switch" />
        </label>
      </div>

      <div class="group-label">上下文</div>
      <div class="panel">
        <div class="list-item" @click="showContextSlider = !showContextSlider">
          <span class="item-label">上下文长度</span>
          <div class="item-right"><span class="item-value">{{ settings.contextLength }} 轮</span><span class="arrow" :class="{ 'arrow-down': showContextSlider }"></span></div>
        </div>
        <div v-show="showContextSlider" class="slider-wrap">
          <input type="range" min="1" max="300" v-model.number="settings.contextLength" class="wx-slider" />
          <div class="hint-text">最近 <strong>{{ settings.contextLength }}</strong> 轮对话。轮数越大 AI 记忆越好，但 Token 消耗增加。</div>
        </div>
      </div>

      <div class="group-label">主动消息</div>
      <div class="panel">
        <label class="list-item">
          <span class="item-label">允许 AI 主动发消息</span>
          <input type="checkbox" v-model="settings.isProactive" class="wx-switch" />
        </label>
        <template v-if="settings.isProactive">
          <label class="list-item sub-item">
            <span class="item-label">定时触发</span>
            <div class="item-right">
              <input v-if="settings.triggerTimer" type="time" v-model="settings.triggerTimerValue" class="time-input" />
              <input type="checkbox" v-model="settings.triggerTimer" class="wx-switch small-switch" />
            </div>
          </label>
          <label class="list-item sub-item">
            <span class="item-label">超时未回触发</span>
            <div class="item-right">
              <select v-if="settings.triggerTimeout" v-model="settings.triggerTimeoutValue" class="wx-select">
                <option value="1">1小时不回</option>
                <option value="3">3小时不回</option>
                <option value="5">5小时不回</option>
                <option value="12">12小时不回</option>
                <option value="24">24小时不回</option>
              </select>
              <input type="checkbox" v-model="settings.triggerTimeout" class="wx-switch small-switch" />
            </div>
          </label>
        </template>
      </div>
      <div v-if="settings.isProactive" class="hint-text">满足勾选条件时，系统将在后台自动唤醒 AI 向你发消息。</div>

      <div class="group-label">关联</div>
      <div class="panel">
        <div class="list-item" @click="currentView = 'persona'">
          <span class="item-label">用户人设</span>
          <div class="item-right"><span class="item-value">{{ selectedPersonaName }}</span><span class="arrow"></span></div>
        </div>
        <div class="list-item" @click="currentView = 'stickers'">
          <span class="item-label">表情包库</span>
          <div class="item-right"><span class="item-value">{{ linkedLibraryName }}</span><span class="arrow"></span></div>
        </div>
      </div>

      <div class="danger-panel">
        <button class="danger-btn" @click="deleteRoleFromDetails">删除角色和聊天记录</button>
      </div>

      <div v-if="saveMsg" class="save-toast">{{ saveMsg }}</div>
    </div>

    <!-- ===== API 方案选择 ===== -->
    <div v-show="currentView === 'api'" class="page-content">
      <div class="group-label">选择 API 方案（角色专属，留空则用全局配置）</div>
      <div class="panel">
        <div
          class="list-item"
          @click="apiProfileId = null"
        >
          <span class="item-label">使用全局配置</span>
          <div class="item-right">
            <svg v-if="!apiProfileId" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div
          v-for="p in apiProfiles"
          :key="p.id"
          class="list-item"
          @click="apiProfileId = p.id"
        >
          <span class="item-label">{{ p.name }}</span>
          <div class="item-right">
            <span class="item-value">{{ p.model || '' }}</span>
            <svg v-if="apiProfileId === p.id" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div v-if="apiProfiles.length === 0" class="empty-hint">暂无方案，请先在「设置 → API 方案」中创建</div>
      </div>
    </div>

    <!-- ===== Minimax 音色 ===== -->
    <div v-show="currentView === 'minimax'" class="page-content">
      <div class="group-label">TTS 模型</div>
      <div class="panel panel-form">
        <div class="form-row" style="position:relative">
          <label class="form-label">模型 ID</label>
          <input class="form-input" v-model="settings.minimaxModel" placeholder="如 speech-2.8-hd" />
          <button class="dropdown-toggle" @click="showModelList = !showModelList">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" :style="{ transform: showModelList ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }">
              <path d="M1 3.5L6 8.5L11 3.5" stroke="#c7c7cc" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <transition name="dropdown">
          <div v-if="showModelList" class="model-dropdown">
            <div class="model-divider"></div>
            <div v-for="m in ttsModeList" :key="m.id" class="list-item"
                 @click="settings.minimaxModel = m.id; showModelList = false">
              <span class="item-label">{{ m.name }}</span>
              <svg v-if="settings.minimaxModel === m.id" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
            </div>
          </div>
        </transition>
      </div>

      <div class="group-label">Voice ID</div>
      <div class="panel panel-form">
        <div class="form-row">
          <label class="form-label">Voice ID</label>
          <input class="form-input" v-model="settings.minimaxVoiceId" placeholder="如 male-qn-qingse" />
        </div>
      </div>
      <div class="group-label">语速调节</div>
      <div class="panel">
        <div class="list-item no-click">
          <span class="item-label">语速 ({{ Number(settings.minimaxSpeed).toFixed(1) }}x)</span>
        </div>
        <div class="slider-wrap">
          <input type="range" min="0.5" max="2.0" step="0.1" v-model.number="settings.minimaxSpeed" class="wx-slider" />
         <div class="slider-labels">
  <span style="left:0%; transform:translateX(0);">0.5x</span>
  <span style="left:33.3%;">1.0x</span>
  <span style="left:100%; transform:translateX(-100%);">2.0x 快</span>
</div>
        </div>
      </div>
      <div class="group-label">音调调节</div>
      <div class="panel">
        <div class="list-item no-click">
          <span class="item-label">音调 ({{ settings.minimaxPitch > 0 ? '+' : '' }}{{ settings.minimaxPitch }})</span>
        </div>
        <div class="slider-wrap">
          <input type="range" min="-12" max="12" step="1" v-model.number="settings.minimaxPitch" class="wx-slider" />
          <div class="slider-labels">
  <span style="left:0%; transform:translateX(0);">低沉</span>
  <span style="left:50%;">原声</span>
  <span style="left:100%; transform:translateX(-100%);">高亢</span>
</div>
        </div>
      </div>
      <div class="hint-text">全局 MiniMax API Key 在「设置 → MiniMax 语音」中配置。</div>
    </div>

    <!-- ===== 记忆设置 ===== -->
    <div v-show="currentView === 'memory'" class="page-content">
      <div class="group-label">长期记忆（AI 沉淀的事实）</div>
      <div class="panel panel-form">
        <div class="form-row textarea-row">
          <textarea
            class="form-textarea"
            v-model="settings.longTermMemory"
            placeholder="每行一条记忆，例如：&#10;· 用户喜欢喝咖啡&#10;· 用户叫小明，18岁"
            rows="5"
          ></textarea>
        </div>
      </div>
      <div class="group-label">核心记忆（始终发送给 AI 的设定）</div>
      <div class="panel panel-form">
        <div class="form-row textarea-row">
          <textarea
            class="form-textarea"
            v-model="settings.coreMemory"
            placeholder="填写角色设定、用户画像等核心信息，每次对话都会发送给 AI。"
            rows="6"
          ></textarea>
        </div>
      </div>
      <div class="hint-text">长期记忆以「[长期记忆]」标注，核心记忆以「[核心设定]」标注，一起附在系统提示中发送给模型。</div>
    </div>

    <!-- ===== 角色编辑 ===== -->
    <div v-show="currentView === 'roleEdit'" class="page-content">
      <div class="group-label">基本信息</div>
      <div class="panel panel-form">
        <div class="form-row">
          <label class="form-label">角色名称</label>
          <input class="form-input" v-model="roleEditData.name" placeholder="请输入角色名称" />
        </div>
        <label class="form-row">
          <span class="form-label">角色头像</span>
          <div class="item-right">
            <img v-if="roleEditData.avatar" :src="roleEditData.avatar" style="width:32px;height:32px;border-radius:6px;margin-right:8px" />
            <span class="text-blue" @click.stop="triggerAvatarUpload">选择图片</span>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="onAvatarUpload" />
        </label>
      </div>
      <div class="group-label">系统提示词</div>
      <div class="panel panel-form">
        <div class="form-row textarea-row">
          <textarea
            class="form-textarea"
            v-model="roleEditData.systemPrompt"
            placeholder="定义角色的性格、说话风格、背景故事等..."
            rows="8"
          ></textarea>
        </div>
      </div>
      <button class="save-btn" @click="saveRoleEdit">保存角色</button>
    </div>

    <!-- ===== 人设卡选择 ===== -->
    <div v-show="currentView === 'persona'" class="page-content">
      <div class="group-label">选择用户人设卡</div>
      <div class="panel">
        <div class="list-item" @click="settings.selectedPersonaId = null">
          <span class="item-label">不使用人设</span>
          <div class="item-right">
            <svg v-if="!settings.selectedPersonaId" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div v-for="p in personas" :key="p.id" class="list-item" @click="settings.selectedPersonaId = p.id">
          <div style="flex:1">
            <div class="item-label">{{ p.name }}</div>
            <div class="item-desc">{{ p.description }}</div>
          </div>
          <div class="item-right">
            <svg v-if="settings.selectedPersonaId === p.id" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div v-if="personas.length === 0" class="empty-hint">暂无人设卡</div>
      </div>
      <div class="hint-text">选择后，AI 将获知你的人设信息和当前状态。</div>
      <button class="save-btn" @click="$router.push('/personas')">管理人设卡</button>
    </div>

    <!-- ===== 表情包关联 ===== -->
    <div v-show="currentView === 'stickers'" class="page-content">
      <div class="group-label">选择表情包库</div>
      <div class="panel">
        <div v-for="lib in libraries" :key="lib.id" class="list-item" @click="selectLibrary(lib.id)">
          <div style="flex:1">
            <div class="item-label">{{ lib.name }}</div>
          </div>
          <input type="radio" :checked="settings.linkedLibraryId === lib.id" class="wx-radio" @click.stop />
        </div>
        <div v-if="libraries.length === 0" class="empty-hint">暂无表情包库</div>
      </div>
      <div class="hint-text">选择后，AI 可在对话中使用该库中的表情包。</div>
      <button class="save-btn" @click="$router.push('/stickers')">管理表情包</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { roleService, conversationService, apiProfileService, personaService, stickerLibraryService } from '../services/db';

const route = useRoute();
const router = useRouter();

// route 可能是 /chat-details/:roleId 或 /chat-details/conv/:convId
const roleId = route.params.roleId ? parseInt(route.params.roleId) : null;
const convId = route.params.convId ? parseInt(route.params.convId) : null;

const currentView = ref('main');
const showContextSlider = ref(false);
const role = ref(null);
const currentConversation = ref(null);
const apiProfiles = ref([]);
const personas = ref([]);
const libraries = ref([]);
const saveMsg = ref('');
const bgInput = ref(null);
const avatarInput = ref(null);
const roleEditData = ref({ name: '', avatar: '', systemPrompt: '' });
const showModelList = ref(false);
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="72" height="72"%3E%3Crect fill="%23ddd" width="72" height="72" rx="12"/%3E%3Cpath fill="%23999" d="M36 18a10 10 0 100 20 10 10 0 000-20zm0 25c-7.3 0-13 4.3-13 9.7V56h26v-3.3C49 47.3 43.3 43 36 43z"/%3E%3C/svg%3E';
const defaultUserAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="72" height="72"%3E%3Crect fill="%2307C160" width="72" height="72" rx="12"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="white"%3E我%3C/text%3E%3C/svg%3E';
const userAvatar = ref(defaultUserAvatar);

const ttsModeList = [
  { id: 'speech-2.8-hd',    name: 'Speech-2.8 HD',    desc: '最新一代 · 最高质量' },
  { id: 'speech-2.8-turbo', name: 'Speech-2.8 Turbo', desc: '最新一代 · 低延迟' },
  { id: 'speech-2.6-hd',    name: 'Speech-2.6 HD',    desc: '旗舰 · 高质量' },
  { id: 'speech-2.6-turbo', name: 'Speech-2.6 Turbo', desc: '旗舰 · 速度优先' },
  { id: 'speech-02-hd',     name: 'Speech-02 HD',     desc: '稳定 · 高质量' },
  { id: 'speech-02-turbo',  name: 'Speech-02 Turbo',  desc: '稳定 · 速度优先' },
  { id: 'speech-01-hd',     name: 'Speech-01 HD',     desc: '旧版 · 高质量' },
  { id: 'speech-01-turbo',  name: 'Speech-01 Turbo',  desc: '旧版 · 速度优先' },
];

const viewTitle = computed(() => {
  const map = { main: '聊天信息', api: 'API 方案', minimax: 'Minimax 音色', memory: '记忆设置', roleEdit: '编辑角色', persona: '用户人设', stickers: '表情包' };
  return map[currentView.value] || '聊天信息';
});

const selectedProfileName = computed(() => {
  if (!apiProfileId.value) return '全局配置';
  const p = apiProfiles.value.find(p => p.id === apiProfileId.value);
  return p ? p.name : '全局配置';
});

const selectedPersonaName = computed(() => {
  if (!settings.selectedPersonaId) return '未选择';
  const p = personas.value.find(p => p.id === settings.selectedPersonaId);
  return p ? p.name : '未选择';
});

const linkedLibraryName = computed(() => {
  if (!settings.linkedLibraryId) return '未选择';
  const lib = libraries.value.find(l => l.id === settings.linkedLibraryId);
  return lib ? lib.name : '未选择';
});

const roleStatus = computed(() => {
  if (!role.value) return '角色资料缺失';
  if (settings.isMuted) return '免打扰中';
  if (settings.isProactive) return '可主动联系';
  return '在线';
});

const settings = reactive({
  contextLength: 15,
  chatBackground: '',
  isTop: false,
  isMuted: false,
  isRealTimeOn: true,
  isProactive: false,
  triggerTimer: false,
  triggerTimerValue: '08:00',
  triggerTimeout: false,
  triggerTimeoutValue: '5',
  minimaxVoiceId: '',
  minimaxModel: 'speech-02-hd',
  minimaxSpeed: 1,
  minimaxPitch: 0,
  longTermMemory: '',
  coreMemory: '',
  selectedPersonaId: null,
  linkedStickerIds: []
});

// API 方案 ID 单独管理（保存到 role.apiProfileId，而不是 chatSettings）
const apiProfileId = ref(null);

const goBack = () => {
  if (currentView.value !== 'main') { currentView.value = 'main'; return; }
  router.back();
};

const loadUserAvatar = () => {
  const saved = localStorage.getItem('userProfile');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    userAvatar.value = data.avatar || defaultUserAvatar;
  } catch (error) {
    console.warn('读取用户头像失败:', error);
  }
};

const triggerBgUpload = () => {
  bgInput.value?.click();
};

const onBgUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    settings.chatBackground = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

const clearBackground = () => {
  settings.chatBackground = '';
};

const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const onAvatarUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    roleEditData.value.avatar = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

const saveRoleEdit = async () => {
  if (!role.value || !roleEditData.value.name.trim()) {
    alert('请填写角色名称');
    return;
  }
  await roleService.update(role.value.id, {
    name: roleEditData.value.name,
    avatar: roleEditData.value.avatar,
    systemPrompt: roleEditData.value.systemPrompt
  });
  role.value = await roleService.getById(role.value.id);
  currentView.value = 'main';
  saveMsg.value = '角色已保存';
  setTimeout(() => { saveMsg.value = ''; }, 1500);
};

const deleteRoleFromDetails = async () => {
  if (!role.value) return;
  const ok = confirm(`确定删除角色"${role.value.name}"吗？删除后相关聊天记录也会被删除。`);
  if (!ok) return;
  await roleService.delete(role.value.id);
  router.replace('/chats');
};

const selectLibrary = (libraryId) => {
  settings.linkedLibraryId = libraryId;
};

const saveSettings = async () => {
  if (!role.value) return;
  await roleService.update(role.value.id, {
    chatSettings: JSON.parse(JSON.stringify(settings)),
    apiProfileId: apiProfileId.value  // 单独保存 API 方案 ID
  });
  // 同步会话的 isTop / isMuted
  if (convId) {
    await conversationService.update(convId, { isTop: settings.isTop, isMuted: settings.isMuted });
  }
  saveMsg.value = '已保存';
  setTimeout(() => { saveMsg.value = ''; }, 1500);
};

watch(settings, saveSettings, { deep: true });
watch(apiProfileId, saveSettings);  // 监听 API 方案变化

watch(currentView, (newView) => {
  if (newView === 'roleEdit' && role.value) {
    roleEditData.value = {
      name: role.value.name || '',
      avatar: role.value.avatar || '',
      systemPrompt: role.value.systemPrompt || ''
    };
  }
});

onMounted(async () => {
  loadUserAvatar();
  apiProfiles.value = await apiProfileService.getAll();
  personas.value = await personaService.getAll();
  libraries.value = await stickerLibraryService.getAll();

  let rid = roleId;
  if (!rid && convId) {
    const conv = await conversationService.getById(convId);
    currentConversation.value = conv || null;
    rid = conv?.roleId;
  }
  if (rid) {
    role.value = await roleService.getById(rid);
    if (role.value?.chatSettings) {
      Object.assign(settings, role.value.chatSettings);
    }
    apiProfileId.value = role.value?.apiProfileId ?? null;
    if (currentConversation.value) {
      settings.isTop = !!currentConversation.value.isTop;
      settings.isMuted = !!currentConversation.value.isMuted;
    }
  }
});
</script>

<style scoped>
.wx-page {
  width: 100%;
  height: 100dvh;
  background: var(--wx-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--wx-text-primary);
}
.nav-bar {
  height: 44px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--wx-white);
  border-bottom: 1px solid var(--wx-border);
  flex-shrink: 0;
}
.nav-back {
  display: flex; align-items: center; gap: 4px;
  font-size: 16px; color: var(--wx-text-primary); cursor: pointer; min-width: 60px;
}
.nav-title { font-size: 17px; font-weight: 600; color: var(--wx-text-primary); }
.nav-placeholder { min-width: 60px; }

.page-content {
  flex: 1; overflow-y: auto;
  padding-bottom: max(40px, env(safe-area-inset-bottom));
}
.page-content::-webkit-scrollbar { display: none; }
.details-home {
  padding-top: 12px;
}

.hero-card {
  position: relative;
  margin: 0 16px 12px;
  padding: 18px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--wx-white) 0%, rgba(7, 193, 96, 0.08) 100%);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
}
.hero-bg {
  position: absolute;
  inset: auto -30px -60px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(7, 193, 96, 0.08);
}
.hero-main {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}
.hero-avatar {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.hero-info {
  flex: 1;
  min-width: 0;
}
.hero-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--wx-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--wx-text-secondary);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #07c160;
  box-shadow: 0 0 0 4px rgba(7, 193, 96, 0.12);
}
.profile-edit-btn {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  color: #07a857;
  background: rgba(7, 193, 96, 0.1);
  font-size: 14px;
  font-weight: 600;
}
.profile-edit-btn:active {
  transform: scale(0.97);
}
.relationship-row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 28px 1fr;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
}
.mini-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mini-profile.right {
  justify-content: flex-end;
  text-align: right;
}
.mini-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  object-fit: cover;
}
.mini-label {
  font-size: 11px;
  color: #9b9b9f;
}
.mini-value {
  max-width: 104px;
  margin-top: 2px;
  overflow: hidden;
  color: var(--wx-text-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.relationship-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #c8d6cc, transparent);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0 16px 14px;
}
.quick-card {
  display: flex;
  min-width: 0;
  min-height: 72px;
  flex-direction: column;
  justify-content: center;
  border: none;
  border-radius: 14px;
  background: var(--wx-white);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
  padding: 10px 8px;
  text-align: left;
}
.quick-card:active {
  transform: scale(0.98);
  background: var(--wx-bg);
}
.quick-title {
  color: var(--wx-text-primary);
  font-size: 14px;
  font-weight: 700;
}
.quick-sub {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: var(--wx-text-secondary);
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.danger-panel {
  margin: 22px 16px 10px;
}
.danger-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 14px;
  background: var(--wx-white);
  color: #ff3b30;
  font-size: 16px;
  font-weight: 600;
}
.danger-btn:active {
  background: rgba(255, 59, 48, 0.1);
}

.group-label {
  padding: 14px 16px 6px;
  font-size: 12px; color: var(--wx-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;
}
.panel {
  background: var(--wx-white); border-radius: 12px; margin: 0 16px 4px; overflow: hidden;
}
.members-panel {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 16px 20px 20px; margin-top: 8px;
}
.member-item { display: flex; flex-direction: column; align-items: center; width: 56px; }
.member-avatar { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; margin-bottom: 6px; }
.member-name { font-size: 11px; color: var(--wx-text-secondary); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.member-add {
  width: 56px; height: 56px; border-radius: 8px;
  border: 2px dashed var(--wx-border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; margin-top: 0;
}
.member-add:active { background: var(--wx-bg); }

.list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; cursor: pointer;
  border-bottom: 1px solid var(--wx-border);
}
.list-item:last-child { border-bottom: none; }
.list-item:active { background: var(--wx-bg); }
.list-item.no-click { cursor: default; }
.list-item.no-click:active { background: transparent; }
.sub-item { padding-left: 28px; }
.item-label { font-size: 16px; color: var(--wx-text-primary); }
.sub-item .item-label { font-size: 15px; color: var(--wx-text-primary); }
.item-desc { font-size: 13px; color: var(--wx-text-secondary); margin-top: 2px; }
.item-right { display: flex; align-items: center; gap: 6px; }
.item-value { font-size: 14px; color: var(--wx-text-secondary); }
.arrow {
  width: 7px; height: 7px;
  border-top: 1.5px solid #c7c7cc; border-right: 1.5px solid #c7c7cc;
  transform: rotate(45deg); transition: transform 0.25s;
}
.arrow-down { transform: rotate(135deg); }

.slider-wrap {
  padding: 8px 16px 14px;
  background: var(--wx-bg);
  border-top: 1px solid var(--wx-border);
}
.wx-slider {
  -webkit-appearance: none; appearance: none; width: 100%; background: transparent; margin: 8px 0;
}
.wx-slider::-webkit-slider-runnable-track {
  height: 4px; background: var(--wx-border); border-radius: 2px;
}
.wx-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
  background: var(--wx-white); box-shadow: 0 1px 4px rgba(0,0,0,0.25); margin-top: -10px; cursor: pointer;
}
.slider-labels { position: relative; height: 16px; font-size: 11px; color: #c7c7cc; }
.slider-labels span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.hint-text { padding: 4px 16px 10px; font-size: 12px; color: var(--wx-text-secondary); line-height: 1.5; }

.wx-switch {
  position: relative; width: 51px; height: 31px;
  appearance: none; -webkit-appearance: none;
  background: var(--wx-border); border-radius: 16px; outline: none; cursor: pointer;
  transition: background-color 0.25s; margin: 0; flex-shrink: 0;
}
.wx-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 27px; height: 27px; background: #fff; border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: transform 0.25s cubic-bezier(0.3,1.05,0.4,1.05);
}
.wx-switch:checked { background: #07c160; }
.wx-switch:checked::after { transform: translateX(20px); }
.small-switch { transform: scale(0.85); }

.time-input, .wx-select, .form-select {
  appearance: none; -webkit-appearance: none; border: none;
  background: transparent; font-size: 14px; color: var(--wx-text-secondary);
  outline: none; font-family: inherit;
}

.panel-form .form-row {
  display: flex; align-items: center; padding: 13px 16px;
  border-bottom: 1px solid var(--wx-border);
}
.panel-form .form-row:last-child { border-bottom: none; }
.form-label { font-size: 15px; color: var(--wx-text-primary); min-width: 72px; flex-shrink: 0; }
.form-input {
  flex: 1; border: none; outline: none; font-size: 15px;
  color: var(--wx-text-primary); text-align: right; background: transparent; font-family: inherit;
}
.form-input::placeholder { color: #c7c7cc; }
.dropdown-toggle {
  background: none; border: none; padding: 4px 0 4px 8px; cursor: pointer; display: flex; align-items: center;
}
.model-divider { height: 1px; background: var(--wx-border); margin: 0 16px; }
.model-dropdown { overflow: hidden; }
.dropdown-enter-active { animation: dropdown-in 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
.dropdown-leave-active { animation: dropdown-out 0.18s cubic-bezier(0.55, 0, 1, 0.45) both; }
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px); max-height: 0; }
  to   { opacity: 1; transform: translateY(0);    max-height: 600px; }
}
@keyframes dropdown-out {
  from { opacity: 1; transform: translateY(0);    max-height: 600px; }
  to   { opacity: 0; transform: translateY(-6px); max-height: 0; }
}
.textarea-row { align-items: flex-start; padding: 12px 16px; }
.form-textarea {
  width: 100%; border: none; outline: none; font-size: 14px;
  color: var(--wx-text-primary); background: transparent; font-family: inherit;
  resize: none; line-height: 1.6;
}
.form-textarea::placeholder { color: #c7c7cc; }

.empty-hint { padding: 14px 16px; font-size: 14px; color: #c7c7cc; }

.save-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.65); color: #fff;
  padding: 8px 20px; border-radius: 20px; font-size: 14px;
  pointer-events: none;
}

.text-blue { color: #007aff; cursor: pointer; }
.text-red { color: #ff3b30; cursor: pointer; }

.save-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 16px 16px;
  padding: 14px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:active {
  opacity: 0.8;
}

.action-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 16px 16px;
  padding: 14px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:active {
  opacity: 0.8;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wx-radio {
  width: 18px;
  height: 18px;
  appearance: none;
  border: 2px solid #c7c7cc;
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  position: relative;
}

.wx-radio:checked {
  border-color: #07c160;
}

.wx-radio:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #07c160;
  border-radius: 50%;
}
</style>
