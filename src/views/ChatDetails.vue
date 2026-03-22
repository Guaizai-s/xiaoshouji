<template>
  <div class="wx-page">
    <div class="nav-bar">
      <div class="nav-back" @click="goBack">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
        {{ currentView !== 'main' ? '聊天信息' : '' }}
      </div>
      <div class="nav-title">{{ viewTitle }}</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- ===== 主页 ===== -->
    <div v-show="currentView === 'main'" class="page-content">
      <!-- 头像区 -->
      <div class="panel members-panel">
        <div class="member-item">
          <img :src="role?.avatar || defaultAvatar" class="member-avatar" />
          <span class="member-name">{{ role?.name || '...' }}</span>
        </div>
        <!-- 加号：未来群聊入口 -->
        <div class="member-add" title="创建群聊（即将上线）">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 4v14M4 11h14" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
      </div>

      <!-- 记忆与上下文 -->
      <div class="group-label">记忆与上下文</div>
      <div class="panel">
        <div class="list-item" @click="currentView = 'memory'">
          <span class="item-label">记忆设置</span>
          <div class="item-right"><span class="item-value">长期 / 核心</span><span class="arrow"></span></div>
        </div>
        <div class="list-item" @click="showContextSlider = !showContextSlider">
          <span class="item-label">上下文长度</span>
          <div class="item-right"><span class="item-value">{{ settings.contextLength }} 轮</span><span class="arrow" :class="{ 'arrow-down': showContextSlider }"></span></div>
        </div>
        <div v-show="showContextSlider" class="slider-wrap">
          <input type="range" min="1" max="300" v-model.number="settings.contextLength" class="wx-slider" />
          <div class="hint-text">最近 <strong>{{ settings.contextLength }}</strong> 轮对话。轮数越大 AI 记忆越好，但 Token 消耗增加。</div>
        </div>
      </div>

      <!-- API & 音色 -->
      <div class="group-label">API 与语音</div>
      <div class="panel">
        <div class="list-item" @click="currentView = 'api'">
          <span class="item-label">API 方案</span>
          <div class="item-right"><span class="item-value">{{ selectedProfileName }}</span><span class="arrow"></span></div>
        </div>
        <div class="list-item" @click="currentView = 'minimax'">
          <span class="item-label">Minimax 音色</span>
          <div class="item-right"><span class="item-value">{{ settings.minimaxVoiceId ? '已配置' : '未配置' }}</span><span class="arrow"></span></div>
        </div>
      </div>

      <!-- 聊天行为 -->
      <div class="group-label">聊天行为</div>
      <div class="panel">
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

      <!-- 主动发消息 -->
      <div class="group-label">主动发消息</div>
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

      <div v-if="saveMsg" class="save-toast">{{ saveMsg }}</div>
    </div>

    <!-- ===== API 方案选择 ===== -->
    <div v-show="currentView === 'api'" class="page-content">
      <div class="group-label">选择 API 方案（角色专属，留空则用全局配置）</div>
      <div class="panel">
        <div
          class="list-item"
          @click="settings.apiProfileId = null"
        >
          <span class="item-label">使用全局配置</span>
          <div class="item-right">
            <svg v-if="!settings.apiProfileId" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div
          v-for="p in apiProfiles"
          :key="p.id"
          class="list-item"
          @click="settings.apiProfileId = p.id"
        >
          <span class="item-label">{{ p.name }}</span>
          <div class="item-right">
            <span class="item-value">{{ p.model || '' }}</span>
            <svg v-if="settings.apiProfileId === p.id" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 4.5" stroke="#07c160" stroke-width="2.5" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div v-if="apiProfiles.length === 0" class="empty-hint">暂无方案，请先在「设置 → API 方案」中创建</div>
      </div>
    </div>

    <!-- ===== Minimax 音色 ===== -->
    <div v-show="currentView === 'minimax'" class="page-content">
      <div class="group-label">角色专属音色配置</div>
      <div class="panel panel-form">
        <div class="form-row">
          <label class="form-label">Voice ID</label>
          <input class="form-input" v-model="settings.minimaxVoiceId" placeholder="克隆音色 ID，留空用默认" />
        </div>
      </div>
      <div class="group-label">语速调节</div>
      <div class="panel">
        <div class="list-item no-click">
          <span class="item-label">语速 ({{ Number(settings.minimaxSpeed).toFixed(1) }}x)</span>
        </div>
        <div class="slider-wrap">
          <input type="range" min="0.5" max="2.0" step="0.1" v-model.number="settings.minimaxSpeed" class="wx-slider" />
          <div class="slider-labels"><span>0.5x 慢</span><span>1.0x 正常</span><span>2.0x 快</span></div>
        </div>
      </div>
      <div class="group-label">音调调节</div>
      <div class="panel">
        <div class="list-item no-click">
          <span class="item-label">音调 ({{ settings.minimaxPitch > 0 ? '+' : '' }}{{ settings.minimaxPitch }})</span>
        </div>
        <div class="slider-wrap">
          <input type="range" min="-12" max="12" step="1" v-model.number="settings.minimaxPitch" class="wx-slider" />
          <div class="slider-labels"><span>-12 低沉</span><span>0 原声</span><span>+12 高亢</span></div>
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

  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { roleService, conversationService, apiProfileService } from '../services/db';

const route = useRoute();
const router = useRouter();

// route 可能是 /chat-details/:roleId 或 /chat-details/conv/:convId
const roleId = route.params.roleId ? parseInt(route.params.roleId) : null;
const convId = route.params.convId ? parseInt(route.params.convId) : null;

const currentView = ref('main');
const showContextSlider = ref(false);
const role = ref(null);
const apiProfiles = ref([]);
const saveMsg = ref('');
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48" rx="4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24"%3E🤖%3C/text%3E%3C/svg%3E';

const viewTitle = computed(() => {
  const map = { main: '聊天信息', api: 'API 方案', minimax: 'Minimax 音色', memory: '记忆设置' };
  return map[currentView.value] || '聊天信息';
});

const selectedProfileName = computed(() => {
  if (!settings.apiProfileId) return '全局配置';
  const p = apiProfiles.value.find(p => p.id === settings.apiProfileId);
  return p ? p.name : '全局配置';
});

const settings = reactive({
  contextLength: 15,
  isTop: false,
  isMuted: false,
  isRealTimeOn: true,
  isProactive: false,
  triggerTimer: false,
  triggerTimerValue: '08:00',
  triggerTimeout: false,
  triggerTimeoutValue: '5',
  minimaxVoiceId: '',
  minimaxSpeed: 1.0,
  minimaxPitch: 0,
  apiProfileId: null,
  longTermMemory: '',
  coreMemory: '',
});

const goBack = () => {
  if (currentView.value !== 'main') { currentView.value = 'main'; return; }
  router.back();
};

const saveSettings = async () => {
  if (!role.value) return;
  await roleService.update(role.value.id, { chatSettings: JSON.parse(JSON.stringify(settings)) });
  // 同步会话的 isTop / isMuted
  if (convId) {
    await conversationService.update(convId, { isTop: settings.isTop, isMuted: settings.isMuted });
  }
  saveMsg.value = '已保存';
  setTimeout(() => { saveMsg.value = ''; }, 1500);
};

watch(settings, saveSettings, { deep: true });

onMounted(async () => {
  apiProfiles.value = await apiProfileService.getAll();

  let rid = roleId;
  if (!rid && convId) {
    const conv = await conversationService.getOrCreate(convId);
    rid = conv?.roleId;
  }
  if (rid) {
    role.value = await roleService.getById(rid);
    if (role.value?.chatSettings) {
      Object.assign(settings, role.value.chatSettings);
    }
  }
});
</script>

<style scoped>
.wx-page {
  width: 100%;
  height: 100dvh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.nav-bar {
  height: 44px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ededed;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}
.nav-back {
  display: flex; align-items: center; gap: 4px;
  font-size: 16px; color: #111; cursor: pointer; min-width: 60px;
}
.nav-title { font-size: 17px; font-weight: 600; color: #111; }
.nav-placeholder { min-width: 60px; }

.page-content {
  flex: 1; overflow-y: auto;
  padding-bottom: max(40px, env(safe-area-inset-bottom));
}
.page-content::-webkit-scrollbar { display: none; }

.group-label {
  padding: 14px 16px 6px;
  font-size: 12px; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.04em;
}
.panel {
  background: #fff; border-radius: 12px; margin: 0 16px 4px; overflow: hidden;
}
.members-panel {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 16px 20px 20px; margin-top: 8px;
}
.member-item { display: flex; flex-direction: column; align-items: center; width: 56px; }
.member-avatar { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; margin-bottom: 6px; }
.member-name { font-size: 11px; color: #666; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.member-add {
  width: 56px; height: 56px; border-radius: 8px;
  border: 2px dashed #d0d0d0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; margin-top: 0;
}
.member-add:active { background: #f5f5f5; }

.list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}
.list-item:last-child { border-bottom: none; }
.list-item:active { background: #f5f5f5; }
.list-item.no-click { cursor: default; }
.list-item.no-click:active { background: transparent; }
.sub-item { padding-left: 28px; }
.item-label { font-size: 16px; color: #111; }
.sub-item .item-label { font-size: 15px; color: #333; }
.item-right { display: flex; align-items: center; gap: 6px; }
.item-value { font-size: 14px; color: #8e8e93; }
.arrow {
  width: 7px; height: 7px;
  border-top: 1.5px solid #c7c7cc; border-right: 1.5px solid #c7c7cc;
  transform: rotate(45deg); transition: transform 0.25s;
}
.arrow-down { transform: rotate(135deg); }

.slider-wrap {
  padding: 8px 16px 14px;
  background: #f9f9f9;
  border-top: 1px solid #f0f0f0;
}
.wx-slider {
  -webkit-appearance: none; width: 100%; background: transparent; margin: 8px 0;
}
.wx-slider::-webkit-slider-runnable-track {
  height: 4px; background: #e0e0e0; border-radius: 2px;
}
.wx-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); margin-top: -10px; cursor: pointer;
}
.slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: #c7c7cc; }
.hint-text { padding: 4px 16px 10px; font-size: 12px; color: #8e8e93; line-height: 1.5; }

.wx-switch {
  position: relative; width: 51px; height: 31px;
  appearance: none; -webkit-appearance: none;
  background: #e5e5e5; border-radius: 16px; outline: none; cursor: pointer;
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

.time-input, .wx-select {
  appearance: none; -webkit-appearance: none; border: none;
  background: transparent; font-size: 14px; color: #8e8e93;
  outline: none; font-family: inherit;
}

.panel-form .form-row {
  display: flex; align-items: center; padding: 13px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.panel-form .form-row:last-child { border-bottom: none; }
.form-label { font-size: 15px; color: #111; min-width: 72px; flex-shrink: 0; }
.form-input {
  flex: 1; border: none; outline: none; font-size: 15px;
  color: #333; text-align: right; background: transparent; font-family: inherit;
}
.form-input::placeholder { color: #c7c7cc; }
.textarea-row { align-items: flex-start; padding: 12px 16px; }
.form-textarea {
  width: 100%; border: none; outline: none; font-size: 14px;
  color: #333; background: transparent; font-family: inherit;
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
</style>
