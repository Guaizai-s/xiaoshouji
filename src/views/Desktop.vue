<template>
  <div class="desktop" :class="currentTheme" :style="wallpaper ? `background-image:url(${wallpaper});background-size:cover;background-position:center` : ''">
    <div class="status-bar">
      <span class="status-time">{{ currentTime.split(' ')[0] }}</span>
      <div class="status-icons">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="15"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
      </div>
    </div>

    <div class="content-scroll">
      
      <div class="hero-card animate-enter" style="--delay: 0.1s">
        <div class="avatar-box" @click="avatarInput.click()">
          <img v-if="heroAvatar" :src="heroAvatar" class="avatar-img" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="placeholder-avatar"><circle cx="12" cy="8" r="4"></circle><path d="M20 21a8 8 0 00-16 0"></path></svg>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="onAvatarUpload" />
        </div>
        <div class="info-box">
          <div class="time-row">
            <span class="clock-time">{{ currentTime }}</span>
          </div>
          <div class="date-row">{{ currentDate }}</div>
          <div
            class="quote-text"
            :contenteditable="editingQuote"
            @click="editingQuote = true"
            @blur="saveQuote"
            @keydown.enter.prevent="$event.target.blur()"
          >{{ quoteText || '点击编辑签名' }}</div>
        </div>
      </div>

      <div class="module-row animate-enter" style="--delay: 0.2s">
        <div class="grid-2x2">
          <div class="app-cell" @click="go('/chats')">
            <div class="small-card">
              <img v-if="customIcons.chat" :src="customIcons.chat" class="custom-icon" />
              <component v-else :is="MsgIcon" />
            </div>
            <span class="card-label">微信</span>
          </div>
          <div class="app-cell">
            <div class="small-card">
              <img v-if="customIcons.forum" :src="customIcons.forum" class="custom-icon" />
              <component v-else :is="ForumIcon" />
            </div>
            <span class="card-label">论坛</span>
          </div>
          <div class="app-cell">
            <div class="small-card">
              <img v-if="customIcons.search" :src="customIcons.search" class="custom-icon" />
              <component v-else :is="SearchIcon" />
            </div>
            <span class="card-label">查手机</span>
          </div>
          <div class="app-cell">
            <div class="small-card">
              <img v-if="customIcons.date" :src="customIcons.date" class="custom-icon" />
              <component v-else :is="DateIcon" />
            </div>
            <span class="card-label">约会</span>
          </div>
        </div>
        <div class="large-card square right-blank" @click="widgetInput.click()">
          <img v-if="widgetImage" :src="widgetImage" class="widget-img" />
          <div v-else class="blank-placeholder">图片/挂件区</div>
          <input ref="widgetInput" type="file" accept="image/*" style="display:none" @change="onWidgetUpload" />
        </div>
      </div>

      <div class="module-row animate-enter" style="--delay: 0.3s">
        <div class="large-card rect">
          <component :is="DiaryIcon" class="icon-svg large-svg" />
          <span class="rect-title">日记</span>
          <span class="rect-sub">记录今天的心情...</span>
        </div>
        <div class="grid-2x2">
          <div class="app-cell" @click="go('/games')">
            <div class="small-card">
              <img v-if="customIcons.games" :src="customIcons.games" class="custom-icon" />
              <component v-else :is="GameIcon" />
            </div>
            <span class="card-label">游戏</span>
          </div>
          <div class="app-cell">
            <div class="small-card">
              <img v-if="customIcons.read" :src="customIcons.read" class="custom-icon" />
              <component v-else :is="ReadIcon" />
            </div>
            <span class="card-label">阅读</span>
          </div>
          <div class="app-cell">
            <div class="small-card">
              <img v-if="customIcons.gacha" :src="customIcons.gacha" class="custom-icon" />
              <component v-else :is="GachaIcon" />
            </div>
            <span class="card-label">账本</span>
          </div>
          <div class="app-cell" @click="go('/settings')">
            <div class="small-card">
              <img v-if="customIcons.settings" :src="customIcons.settings" class="custom-icon" />
              <component v-else :is="SettingsIcon" />
            </div>
            <span class="card-label">设置</span>
          </div>
        </div>
      </div>

    </div>

    <div class="dock-container animate-enter" style="--delay: 0.4s">
      <div class="dock">
        <div class="dock-item" @click="go('/chats')">
          <component :is="WechatIcon" class="icon-svg" />
          <span>短信</span>
        </div>
        <div class="dock-item">
          <component :is="RegexIcon" class="icon-svg" />
          <span>正则</span>
        </div>
        <div class="dock-item">
          <component :is="WorldIcon" class="icon-svg" />
          <span>世界书</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { assetService } from '../services/db.js';

const router = useRouter();

const now = ref(new Date());
let timer;

const wallpaper = ref('');
const currentTheme = ref(localStorage.getItem('systemTheme') || 'theme-minimal');
const heroAvatar = ref('');
const widgetImage = ref('');
const quoteText = ref('');
const customIcons = ref({});
const editingQuote = ref(false);
const avatarInput = ref(null);
const widgetInput = ref(null);

const ASSET_KEYS = ['desktopWallpaper', 'desktop_avatar', 'desktop_widget',
  ...['chat','forum','search','date','diary','games','read','gacha','settings','wechat','regex','world'].map(id => `icon_${id}`)];

onMounted(async () => {
  timer = setInterval(() => { now.value = new Date(); }, 1000);

  // 迁移旧 localStorage 图片数据到 Dexie
  for (const key of ASSET_KEYS) {
    const old = localStorage.getItem(key);
    if (old) { await assetService.set(key, old); localStorage.removeItem(key); }
  }

  wallpaper.value   = await assetService.get('desktopWallpaper') || '';
  heroAvatar.value  = await assetService.get('desktop_avatar') || '';
  widgetImage.value = await assetService.get('desktop_widget') || '';
  quoteText.value   = localStorage.getItem('desktop_quote') || '';
  const icons = {};
  for (const id of ['chat','forum','search','date','diary','games','read','gacha','settings','wechat','regex','world']) {
    icons[id] = await assetService.get(`icon_${id}`) || '';
  }
  customIcons.value = icons;
});
onUnmounted(() => { clearInterval(timer); });

// 格式化时间为带 AM/PM 的格式 (10:10 AM)
const currentTime = computed(() => {
  return now.value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
});

// 格式化日期 (4/16 周四)
const currentDate = computed(() => {
  const d = now.value;
  const days = ['日','一','二','三','四','五','六'];
  return `${d.getMonth()+1}/${d.getDate()} 周${days[d.getDay()]}`;
});

const go = (path) => {
  if (path) router.push(path);
};

const onAvatarUpload = (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { heroAvatar.value = ev.target.result; assetService.set('desktop_avatar', ev.target.result); };
  reader.readAsDataURL(file);
};

const onWidgetUpload = (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.7);
      widgetImage.value = data;
      assetService.set('desktop_widget', data);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const saveQuote = (e) => {
  quoteText.value = e.target.innerText.trim();
  localStorage.setItem('desktop_quote', quoteText.value);
  editingQuote.value = false;
};

// ---- 极简矢量图标生成器 ----
const mkIcon = (paths) => ({
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'icon-svg' }, paths.map(d => h('path', { d })));
  }
});

// 图标库 (部分复用之前，部分为草图新增)
const MsgIcon = mkIcon(['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z']);
const ForumIcon = mkIcon(['M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z']);
const SearchIcon = mkIcon(['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z']);
const DateIcon = mkIcon(['M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z']);
const DiaryIcon = mkIcon(['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z']);
const GameIcon = mkIcon(['M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', 'M3.27 6.96L12 12.01l8.73-5.05', 'M12 22.08V12']);
const ReadIcon = mkIcon(['M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253']);
const GachaIcon = mkIcon(['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z']);
const SettingsIcon = mkIcon(['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z']);
const WechatIcon = mkIcon(['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z']);
const RegexIcon = mkIcon(['M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4']);
const WorldIcon = mkIcon(['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z']);

</script>

<style scoped>
.desktop {
  --bg-color: #f5f4ed;
  --card-bg: #faf9f5;
  --accent-color: #d97757;
  --text-main: #5c504d;
  --text-sub: #9e938f;
  --shadow-color: rgba(217, 119, 87, 0.06);

  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
  overflow: hidden;
  position: relative;
}

.desktop.theme-nordic {
  --bg-color: #f0f4f8;
  --card-bg: #ffffff;
  --accent-color: #6b8ea5;
  --text-main: #2c3e50;
  --text-sub: #7f8c8d;
  --shadow-color: rgba(107, 142, 165, 0.08);
}

.desktop.theme-data {
  --bg-color: #1e2024;
  --card-bg: #2a2d34;
  --accent-color: #40d1af;
  --text-main: #e0e6ed;
  --text-sub: #8892b0;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* 状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: env(safe-area-inset-top) 24px 10px;
  font-size: 14px;
  font-weight: 600;
  z-index: 10;
}
.status-icons { display: flex; gap: 6px; align-items: center; }

/* 滚动区 */
.content-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; 
  padding: 0 20px; /* 只留左右边距 */
  box-sizing: border-box;
  /* 如果内容太多超出屏幕，再允许滚动；正常情况下它会刚好撑满 */
  overflow-y: hidden; 
}

/* 进场动画 */
.animate-enter {
  animation: fadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 顶部 Hero 卡片 */
.hero-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px var(--shadow-color);
}
.avatar-box {
  width: 70px;
  height: 70px;
  background: var(--bg-color);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
}
.info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.clock-time {
  font-size: 26px;
  font-weight: 300;
  color: var(--accent-color);
  line-height: 1.1;
}
.date-row {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  margin-top: 4px;
}
.quote-text {
  font-size: 12px;
  color: var(--text-sub);
  margin-top: 8px;
  background: rgba(217, 119, 87, 0.05);
  padding: 6px 10px;
  border-radius: 10px;
  display: inline-block;
}

/* 模块排版 */
.module-row {
  display: flex;
  justify-content: center; 
  gap: 16px;
  height: 160px; 
  margin: 10px 0;
}

.avatar-box { cursor: pointer; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 18px; }
.custom-icon { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
.widget-img { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; }

/* 四宫格网格 */
.grid-2x2 {
  height: 100%;
  aspect-ratio: 1 / 1; 
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
}
/* app 单元：图标卡片 + 标签 */
.app-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

/* 独立小卡片：缩小为正方形图标 */
.small-card {
  background: var(--card-bg);
  border-radius: 14px;
  width: 52px;  /* 统一固定大小 */
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: transform 0.15s;
  overflow: hidden;
  flex-shrink: 0;
}

.small-card:active { transform: scale(0.92); }

.card-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-sub);
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 防止名字太长撑破布局 */
}

/* 独立大卡片 (方形/矩形) */
.large-card {
  height: 100%;
  aspect-ratio: 1 / 1; 
  background: var(--card-bg);
  border-radius: 24px;
  box-shadow: 0 8px 24px var(--shadow-color);
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}
/* 留白区特殊样式 */
.right-blank {
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(217, 119, 87, 0.2);
  background: transparent;
  box-shadow: none;
  padding: 0;
  overflow: hidden;
}
.blank-placeholder {
  color: var(--text-sub);
  font-size: 12px;
  letter-spacing: 1px;
}

/* 矩形卡片内部排版 */
.rect-title { font-size: 18px; font-weight: 600; margin-top: auto; }
.rect-sub { font-size: 12px; color: var(--text-sub); margin-top: 4px; }
.large-svg {
  position: absolute;
  top: 16px; right: 16px;
  width: 32px; height: 32px;
  opacity: 0.2;
}

/* SVG 颜色控制 */
.icon-svg {
  width: 24px;
  height: 24px;
  color: var(--accent-color);
}

/* Dock 栏 */
.dock-container {
  position: relative; 
  z-index: 20;
  width: 100%;
  margin-bottom: env(safe-area-inset-bottom); 
}
.dock {
  background: var(--card-bg);
  border-radius: 28px;
  height: 70px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 12px 32px var(--shadow-color);
  /* 增加一点毛玻璃效果 */
  background: rgba(250, 249, 245, 0.85);
  backdrop-filter: blur(16px);
}
.desktop.theme-nordic .dock {
  background: rgba(255, 255, 255, 0.85);
}
.desktop.theme-data .dock {
  background: rgba(58, 62, 72, 0.85);
}
.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.dock-item span {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-main);
}
</style>