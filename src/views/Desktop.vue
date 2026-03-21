<template>
  <div
    class="desktop"
    @click="isEditMode && setEditMode(false)"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
  >

    <!-- 壁纸层 -->
    <div class="wallpaper" :style="wallpaperStyle"></div>
    <div class="wallpaper-overlay"></div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="status-time">{{ currentTime }}</span>
      <div class="status-icons">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="15"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
      </div>
    </div>

    <!-- 时钟 -->
    <div class="desktop-clock">
      <div class="clock-time">{{ currentTime }}</div>
      <div class="clock-date">{{ currentDate }}</div>
    </div>

    <!-- 图标网格 -->
    <div class="app-grid">
      <div
        v-for="app in gridApps"
        :key="app.id"
        class="app-item"
        @click.stop="handleAppClick(app)"
      >
        <div
          class="app-icon"
          :style="app.customIcon
            ? { backgroundImage: `url(${app.customIcon})`, backgroundSize: 'cover' }
            : { background: app.gradient }"
        >
          <component v-if="!app.customIcon" :is="app.iconComponent" class="icon-svg" />
        </div>
        <span class="app-name">{{ app.name }}</span>
      </div>
    </div>

    <!-- 页面指示点 -->
    <div class="page-dots">
      <div class="dot active"></div>
    </div>

    <!-- Dock 栏 -->
    <div class="dock">
      <div class="home-bar"></div>
      <div
        v-for="app in dockApps"
        :key="'dock-' + app.id"
        class="dock-item"
        @click.stop="handleAppClick(app)"
      >
        <div
          class="app-icon dock-icon"
          :style="app.customIcon
            ? { backgroundImage: `url(${app.customIcon})`, backgroundSize: 'cover' }
            : { background: app.gradient }"
        >
          <component v-if="!app.customIcon" :is="app.iconComponent" class="icon-svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted, h } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 时间
const now = ref(new Date());
let timer;

const loadWallpaper = () => {
  wallpaperUrl.value = localStorage.getItem('desktopWallpaper') || localStorage.getItem('desktop_wallpaper') || '';
};
const loadCustomIcons = () => {
  gridApps.value.forEach(app => {
    app.customIcon = localStorage.getItem(`icon_${app.id}`) || '';
  });
};

onMounted(() => {
  timer = setInterval(() => { now.value = new Date(); }, 1000);
  loadWallpaper();
  loadCustomIcons();
});
onActivated(() => {
  loadWallpaper();
  loadCustomIcons();
});
onUnmounted(() => { clearInterval(timer); });

const currentTime = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
);
const currentDate = computed(() => {
  const d = now.value;
  const days = ['日','一','二','三','四','五','六'];
  return `${d.getMonth()+1}月${d.getDate()}日 星期${days[d.getDay()]}`;
});

// 壁纸
const wallpaperUrl = ref(localStorage.getItem('desktopWallpaper') || localStorage.getItem('desktop_wallpaper') || '');
const wallpaperStyle = computed(() => wallpaperUrl.value
  ? { backgroundImage: `url(${wallpaperUrl.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : {}
);

// 编辑模式
const isEditMode = ref(false);
const longPressTimer = ref(null);

const handlePointerDown = () => {
  if (!isEditMode.value) {
    longPressTimer.value = setTimeout(() => setEditMode(true), 600);
  }
};
const handlePointerUp = () => {
  if (longPressTimer.value) { clearTimeout(longPressTimer.value); longPressTimer.value = null; }
};
const setEditMode = (v) => { isEditMode.value = v; };

// 拖拽排序
const dragId = ref(null);
const onDragStart = (e, id) => { dragId.value = id; e.dataTransfer.effectAllowed = 'move'; };
const onDrop = (e, targetId) => {
  if (!dragId.value || dragId.value === targetId) return;
  const arr = gridApps.value;
  const from = arr.findIndex(a => a.id === dragId.value);
  const to   = arr.findIndex(a => a.id === targetId);
  if (from === -1 || to === -1) return;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  gridApps.value = copy;
  dragId.value = null;
};
const deleteApp = (id) => { gridApps.value = gridApps.value.filter(a => a.id !== id); };

// ---- 图标 SVG 组件 ----
const mkIcon = (paths) => ({
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'icon-svg' }, paths.map(d => h('path', { d })));
  }
});
const mkIconFill = (pathD) => ({
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'icon-svg' }, [h('path', { d: pathD })]);
  }
});

const WechatIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'icon-svg' }, [
      h('path', { d: 'M20.9 10.6C20.9 6.9 17.4 4 13.1 4 8.5 4 4.7 7.2 4.7 11.2c0 2 1 3.8 2.6 5l-.8 2.4 2.7-1.3c.9.3 1.8.4 2.8.4.3 0 .5 0 .8-.1-.2-.5-.3-1.1-.3-1.7 0-3.5 3.1-6.3 6.9-6.3h.5zM10.4 9.3a.9.9 0 110-1.8.9.9 0 010 1.8zm5.2 0a.9.9 0 110-1.8.9.9 0 010 1.8z' }),
      h('path', { d: 'M23 15.9c0-3.1-2.9-5.6-6.4-5.6-3.5 0-6.4 2.5-6.4 5.6s2.9 5.6 6.4 5.6c.8 0 1.5-.1 2.2-.3l2.1 1-.6-1.9C22.2 19.3 23 17.7 23 15.9zm-8.3-1.1a.8.8 0 110-1.6.8.8 0 010 1.6zm3.9 0a.8.8 0 110-1.6.8.8 0 010 1.6z' })
    ]);
  }
};
const GameIcon = mkIcon(['M6 12h4m-2-2v4', 'M2 8a4 4 0 014-4h12a4 4 0 014 4v8a4 4 0 01-4 4H6a4 4 0 01-4-4V8z', 'M17 11h.01M19 13h.01']);
const LedgerIcon = mkIcon(['M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2m0-8v1m0 10v1']);
const SettingsIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'icon-svg' }, [
      h('circle', { cx: '12', cy: '12', r: '3' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' })
    ]);
  }
};
const PhotoIcon = mkIcon(['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z']);
const CameraIcon = mkIcon(['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z', 'M12 17a4 4 0 100-8 4 4 0 000 8z']);
const WeatherIcon = mkIcon(['M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41', 'M12 8a4 4 0 100 8 4 4 0 000-8z']);
const PhoneIcon = mkIcon(['M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.05a16 16 0 006.86 6.86l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z']);
const BrowserIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', class: 'icon-svg' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('path', { d: 'M12 2a14.5 14.5 0 010 20M2 12h20' })
    ]);
  }
};
const MusicIcon = mkIcon(['M9 18V5l12-2v13', 'M9 18a3 3 0 11-3-3 3 3 0 013 3zm12-2a3 3 0 11-3-3 3 3 0 013 3z']);
const MsgIcon = mkIcon(['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z']);

// 应用数据
const gridApps = ref([
  { id: 'wechat',   name: '微信',   gradient: 'linear-gradient(145deg,#5ed87c,#07c160)', iconComponent: WechatIcon,  route: '/chats',    customIcon: localStorage.getItem('icon_wechat') || '' },
  { id: 'games',    name: '游戏',   gradient: 'linear-gradient(145deg,#a78bfa,#6d28d9)', iconComponent: GameIcon,    route: null,        customIcon: localStorage.getItem('icon_games') || '' },
  { id: 'ledger',   name: '账本',   gradient: 'linear-gradient(145deg,#fcd34d,#f59e0b)', iconComponent: LedgerIcon,  route: null,        customIcon: localStorage.getItem('icon_ledger') || '' },
  { id: 'photos',   name: '相册',   gradient: 'linear-gradient(145deg,#60a5fa,#2563eb)', iconComponent: PhotoIcon,   route: null,        customIcon: localStorage.getItem('icon_photos') || '' },
  { id: 'camera',   name: '相机',   gradient: 'linear-gradient(145deg,#9ca3af,#4b5563)', iconComponent: CameraIcon,  route: null,        customIcon: localStorage.getItem('icon_camera') || '' },
  { id: 'weather',  name: '天气',   gradient: 'linear-gradient(145deg,#7dd3fc,#0ea5e9)', iconComponent: WeatherIcon, route: null,        customIcon: localStorage.getItem('icon_weather') || '' },
  { id: 'settings', name: '设置',   gradient: 'linear-gradient(145deg,#6b7280,#374151)', iconComponent: SettingsIcon,route: '/settings', customIcon: localStorage.getItem('icon_settings') || '' },
]);

const dockApps = ref([
  { id: 'phone',    name: '电话',   gradient: 'linear-gradient(145deg,#4ade80,#16a34a)', iconComponent: PhoneIcon,   route: null },
  { id: 'safari',   name: '浏览器', gradient: 'linear-gradient(145deg,#38bdf8,#0284c7)', iconComponent: BrowserIcon, route: null },
  { id: 'messages', name: '信息',   gradient: 'linear-gradient(145deg,#4ade80,#22c55e)', iconComponent: MsgIcon,     route: null },
  { id: 'music',    name: '音乐',   gradient: 'linear-gradient(145deg,#f87171,#dc2626)', iconComponent: MusicIcon,   route: null },
]);

const handleAppClick = (app) => {
  if (isEditMode.value) return;
  if (app.route) router.push(app.route);
};
</script>

<style scoped>
.desktop {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  user-select: none;
}

/* 壁纸 */
.wallpaper {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #e8416b 0%, #6c2fad 35%, #2563eb 70%, #06b6d4 100%);
  z-index: 0;
}
.wallpaper-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.08);
  backdrop-filter: blur(0px);
  z-index: 1;
}

/* 状态栏 */
.status-bar {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 22px 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.status-icons { display: flex; gap: 5px; align-items: center; }

/* 编辑完成按钮 */
.edit-done-btn {
  position: absolute;
  top: 48px;
  right: 16px;
  z-index: 30;
  background: rgba(255,255,255,0.22);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  cursor: pointer;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 时钟 */
.desktop-clock {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.25);
  padding: 20px 0 12px;
}
.clock-time {
  font-size: 72px;
  font-weight: 200;
  letter-spacing: -2px;
  line-height: 1;
}
.clock-date {
  font-size: 16px;
  font-weight: 400;
  margin-top: 6px;
  opacity: 0.92;
}

/* 图标网格 */
.app-grid {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px 4px;
  padding: 16px 16px;
  flex: 1;
  align-content: start;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.app-item:active .app-icon { transform: scale(0.88); }

/* 图标 */
.app-icon {
  width: 62px;
  height: 62px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow:
    0 4px 14px rgba(0,0,0,0.22),
    inset 0 1px 0 rgba(255,255,255,0.25);
  transition: transform 0.15s;
  overflow: hidden;
}

.dock-icon {
  width: 56px;
  height: 56px;
  border-radius: 15px;
}
.icon-svg {
  width: 30px;
  height: 30px;
  position: relative;
  z-index: 1;
}

.app-name {
  font-size: 11px;
  color: white;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  text-align: center;
  line-height: 1.2;
}

/* 页面指示点 */
.page-dots {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
}
.dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
}
.dot.active { background: white; }

/* Dock 栏 */
.dock {
  position: relative;
  z-index: 10;
  margin: 0 16px 12px;
  padding: 10px 16px 6px;
  background: rgba(255,255,255,0.16);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: 30px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.35),
    inset 0 -1px 0 rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.dock-item { cursor: pointer; }
.dock-item:active .dock-icon { transform: scale(0.88); }

/* Home 指示条 */
.home-bar {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px; height: 4px;
  background: rgba(255,255,255,0.55);
  border-radius: 2px;
}
</style>
