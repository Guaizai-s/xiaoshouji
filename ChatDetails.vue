<template>
  <div class="wx-page">
    <!-- 导航栏 -->
    <div class="nav-bar">
      <div class="nav-back" @click="goBack">‹ 返回</div>
      <div class="nav-title">{{ viewTitle }}</div>
      <div class="nav-more"></div>
    </div>

    <!-- ================= 主设置页 ================= -->
    <div class="page-view" v-show="currentView === 'main'">
      
      <!-- 1. 头像区 -->
      <div class="panel members-panel">
        <div class="member-item">
          <img :src="role?.avatar" class="member-avatar" alt="avatar">
          <span class="member-name">{{ role?.name || '加载中...' }}</span>
        </div>
      </div>

      <!-- 2. 记忆与上下文 -->
      <div class="panel">
        <div class="list-item" @click="currentView = 'memory'">
          <span class="item-label">记忆设置</span>
          <div class="item-right">
            <span class="item-value">长期 / 核心</span>
            <span class="item-arrow"></span>
          </div>
        </div>
        
        <div class="list-item" @click="showContextSlider = !showContextSlider">
          <span class="item-label">上下文长度设置</span>
          <div class="item-right">
            <span class="item-value">{{ settings.contextLength }} 轮</span>
            <span class="item-arrow" :class="{ 'arrow-down': showContextSlider }"></span>
          </div>
        </div>
        
        <div class="slider-container" v-show="showContextSlider">
          <input type="range" min="1" max="300" v-model="settings.contextLength" class="wx-slider">
          <div class="hint-text slider-hint">
            向大模型发送最近 <strong>{{ settings.contextLength }}</strong> 轮的对话内容。<br>
            <span class="warning-text">注：长度越大，AI越不容易失忆，但会增加Token消耗。</span>
          </div>
        </div>
      </div>

      <!-- 3. 高级 API & 音色 -->
      <div class="panel">
        <div class="list-item">
          <span class="item-label">API 设置</span>
          <div class="item-right">
            <span class="item-value">专属配置</span>
            <span class="item-arrow"></span>
          </div>
        </div>
        <div class="list-item" @click="currentView = 'minimax'">
          <span class="item-label">Minimax 音色配置</span>
          <div class="item-right">
            <span class="item-value">{{ settings.minimaxVoiceId ? '已配置' : '未配置' }}</span>
          <span class="item-arrow"></span>
          </div>
        </div>
      </div>

      <!-- 4. 聊天行为 & 真实时间感知 -->
      <div class="panel">
        <label class="list-item">
          <span class="item-label">置顶聊天</span>
          <input type="checkbox" v-model="settings.isTop" class="wx-switch">
        </label>
        <label class="list-item">
          <span class="item-label">消息免打扰</span>
          <input type="checkbox" v-model="settings.isMuted" class="wx-switch">
        </label>
        <label class="list-item">
          <span class="item-label">真实时间感知</span>
          <input type="checkbox" v-model="settings.isRealTimeOn" class="wx-switch">
        </label>
      </div>
      <div class="hint-text" v-if="settings.isRealTimeOn">
        已开启：每次发送消息时将向 AI 附带当前系统时间，AI 将能感知昼夜交替与日期变化。
      </div>

      <!-- 5. 主动发送消息 -->
      <div class="panel">
        <label class="list-item">
          <span class="item-label">允许 AI 主动发消息</span>
          <input type="checkbox" v-model="settings.isProactive" class="wx-switch">
        </label>
        
        <template v-if="settings.isProactive">
          <!-- 定时触发 -->
          <label class="list-item sub-item">
            <span class="item-label">定时触发</span>
            <div class="item-right">
              <input type="time" v-if="settings.triggerTimer" v-model="settings.triggerTimerValue" class="wx-input time-input">
              <input type="checkbox" v-model="settings.triggerTimer" class="wx-switch small-switch">
            </div>
          </label>
          
          <!-- 超时未回触发 -->
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
              <input type="checkbox" v-model="settings.triggerTimeout" class="wx-switch small-switch">
            </div>
          </label>
        </template>
      </div>
      <div class="hint-text" v-if="settings.isProactive">
        开启后，当满足勾选的条件时，系统将在后台自动唤醒大模型向你发送消息。可同时勾选多个触发条件。
      </div>
    </div>

    <!-- ================= 子页面：Minimax 音色 ================= -->
    <div class="page-view" v-show="currentView === 'minimax'">
      <div class="panel panel-top-margin">
        <div class="list-item">
          <span class="item-label">Voice ID</span>
          <div class="item-right">
            <input type="text" v-model="settings.minimaxVoiceId" placeholder="请输入克隆音色 ID" class="wx-input">
          </div>
        </div>
      </div>
      <div class="hint-text">填写 Minimax 开放平台的自定义音色 ID。留空则使用默认音色。</div>

      <div class="panel">
        <div class="list-item no-border-bottom">
          <span class="item-label">语音语速 ({{ settings.minimaxSpeed }}x)</span>
        </div>
        <div class="slider-container">
          <input type="range" min="0.5" max="2.0" step="0.1" v-model="settings.minimaxSpeed" class="wx-slider">
          <div class="slider-labels">
            <span>0.5x (慢)</span>
            <span>1.0x (正常)</span>
            <span>2.0x (快)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 子页面：记忆设置 ================= -->
    <div class="page-view" v-show="currentView === 'memory'">
      <div class="panel panel-top-margin">
        <div class="list-item">
          <span class="item-label">长期记忆管理</span>
          <div class="item-right">
            <span class="item-value">已沉淀 12 条</span>
            <span class="item-arrow"></span>
          </div>
        </div>
        <div class="list-item">
          <span class="item-label">核心记忆管理</span>
          <div class="item-right">
            <span class="item-value">用户画像与设定</span>
            <span class="item-arrow"></span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 导入你的数据库服务，假设路径是这样
// import { roleService } from '../services/db';

const route = useRoute();
const router = useRouter();
const roleId = route.params.id; // 获取当前角色的ID

const currentView = ref('main');
const showContextSlider = ref(false);

const viewTitle = computed(() => {
  if (currentView.value === 'main') return '聊天信息';
  if (currentView.value === 'memory') return '记忆设置';
  if (currentView.value === 'minimax') return 'Minimax 音色';
  return '';
});

// 模拟角色数据，实际中应该从 IndexedDB 加载
const role = ref(null);

// 将所有设置集中在一个 reactive 对象中，方便监听和保存
const settings = reactive({
  contextLength: 15,
  isTop: false,
  isMuted: false,
  isRealTimeOn: true,
  isProactive: false,
  triggerTimer: false,
  triggerTimerValue: '08:00',
  triggerTimeout: true,
  triggerTimeoutValue: '5',
  minimaxVoiceId: '',
  minimaxSpeed: 1.0
});

onMounted(async () => {
  // --- 云溪的提示：在这里对接你的 IndexedDB ---
  // role.value = await roleService.getById(parseInt(roleId));
  // 如果 role 里面有 settings 字段，把它取出来赋给 settings
  // if (role.value && role.value.settings) {
  //   Object.assign(settings, role.value.settings);
  // }
  
  // 临时测试用的模拟数据
  role.value = {
    name: 'AI 助手',
    avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%2307c160" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="white"%3EAI%3C/text%3E%3C/svg%3E'
  };
});

// 监听 settings 的变化，自动保存到数据库
watch(settings, async (newSettings) => {
  console.log('配置已更新，准备保存到数据库', newSettings);
  // --- 云溪的提示：在这里写保存逻辑 ---
  // await roleService.update(parseInt(roleId), { settings: JSON.parse(JSON.stringify(newSettings)) });
}, { deep: true });

const goBack = () => {
  if (currentView.value !== 'main') {
    currentView.value = 'main'; // 退回主设置页
  } else {
    router.back(); // 返回聊天界面
  }
};
</script>

<style scoped>
/* --- 基础与外壳 --- */
.wx-page {
  width: 100%;
  height: 100vh;
  background-color: #ededed;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* --- 导航栏 --- */
.nav-bar {
  height: 44px;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ededed;
  border-bottom: 1px solid #e5e5e5;
  z-index: 10;
  flex-shrink: 0;
  /* 适配刘海屏和状态栏 */
  padding-top: env(safe-area-inset-top);
}
.nav-back {
  font-size: 16px;
  color: #111;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.nav-title {
  font-size: 17px;
  font-weight: 500;
  color: #111;
  text-align: center;
  flex: 1;
}
.nav-more { width: 40px; }

/* --- 页面内容切换过渡 --- */
.page-view {
  flex: 1;
  overflow-y: auto;
  padding-bottom: max(40px, env(safe-area-inset-bottom));
  width: 100%;
  animation: slideInRight 0.3s ease-out;
}
.page-view::-webkit-scrollbar { display: none; }

/* --- 通用面板与列表 --- */
.panel {
  background-color: #ffffff;
  margin-bottom: 8px;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
}
.panel:first-child { border-top: none; }
.panel-top-margin { margin-top: 8px; }

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 16px 0;
  margin-left: 20px;
  cursor: pointer;
  transition: background-color 0.1s;
}
.list-item.sub-item {
  margin-left: 40px;
  padding: 14px 20px 14px 0;
}
.list-item:active { background-color: #f2f2f2; }
.list-item:last-child { border-bottom: none; }
.list-item:not(:last-child) { border-bottom: 1px solid #e5e5e5; }
.no-border-bottom { border-bottom: none !important; }

.item-label { font-size: 16px; color: #111; }
.sub-item .item-label { font-size: 15px; color: #333; }
.item-right { display: flex; align-items: center; }
.item-value { font-size: 15px; color: #999; }

/* 提示文本 */
.hint-text {
  padding: 6px 20px 12px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

/* 向右箭头 */
.item-arrow {
  width: 8px;
  height: 8px;
  border-top: 2px solid #b2b2b2;
  border-right: 2px solid #b2b2b2;
  transform: rotate(45deg);
  margin-left: 6px;
  transition: transform 0.3s ease;
}
.arrow-down { transform: rotate(135deg); margin-top: -4px;}

/* --- 仿微信 Switch 开关 --- */
.wx-switch {
  position: relative;
  width: 51px;
  height: 31px;
  appearance: none;
  -webkit-appearance: none;
  background-color: #e5e5e5;
  border-radius: 16px;
  outline: none;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0;
}
.wx-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.3, 1.05, 0.4, 1.05);
}
.wx-switch:checked { background-color: #07c160; }
.wx-switch:checked::after { transform: translateX(20px); }
.small-switch { transform: scale(0.85); }

/* --- 输入框与原生组件 --- */
.wx-input, .wx-select {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #999;
  outline: none;
  text-align: right;
  font-family: inherit;
}
.wx-input::placeholder { color: #ccc; }
.time-input { margin-right: 10px; }
.wx-select { margin-right: 10px; direction: rtl; }

/* 时间选择器特定样式 */
input[type="time"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 20px;
  width: 50px;
}

/* --- 滑动条 --- */
.slider-container {
  padding: 10px 20px 20px 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e5e5e5;
}
.wx-slider {
  -webkit-appearance: none;
  width: 100%;
  margin: 10px 0;
  background: transparent;
}
.wx-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
}
.wx-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  margin-top: -10px;
  cursor: pointer;
}
.slider-hint { padding: 0; background: transparent; }
.warning-text { color: #e64340; }
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #ccc;
}

/* 头像区域 */
.members-panel { padding: 16px 20px 20px; display: flex; gap: 20px; }
.member-item { display: flex; flex-direction: column; align-items: center; width: 52px; }
.member-avatar { width: 52px; height: 52px; border-radius: 6px; object-fit: cover; margin-bottom: 6px; }
.member-name { font-size: 12px; color: #666; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@keyframes slideInRight {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>