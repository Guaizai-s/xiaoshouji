<template>
  <div class="page">

    <!-- 页面滑动容器 -->
    <div
      class="slide-container"
      :style="{ transform: activePage === 'main' ? 'translateX(0)' : 'translateX(-50%)' }"
    >
      <!-- ===== 主页 ===== -->
      <div class="slide-page">
        <!-- 导航栏占位 -->
        <div class="nav-placeholder">
          <div class="nav-back" @click="router.back()">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            返回
          </div>
        </div>

        <div class="scroll-area">
          <h1 class="big-title">设置</h1>

          <!-- API -->
          <div class="card-group">
            <div class="card-item" @click="activePage = 'api'">
              <div class="item-icon bg-blue-500"><cpu-icon /></div>
              <span class="item-label">聊天 API</span>
              <div class="item-right">
                <span class="item-value">{{ apiProfiles.length }} 个方案</span>
                <chevron-right />
              </div>
            </div>
            <div class="card-item" @click="activePage = 'minimax'">
              <div class="item-icon bg-orange-500"><mic-icon /></div>
              <span class="item-label">MiniMax 语音</span>
              <div class="item-right">
                <span class="item-value">{{ globalMinimax.apiKey ? '已配置' : '未配置' }}</span>
                <chevron-right />
              </div>
            </div>
            <label class="card-item">
              <div class="item-icon bg-purple-500">🌐</div>
              <span class="item-label">直接调用API</span>
              <input type="checkbox" v-model="useDirectAPI" @change="saveDirectAPI" class="wx-switch" />
            </label>
          </div>

          <!-- 数据管理 -->
          <div class="card-group mt-8">
            <div class="card-item" @click="activePage = 'data'">
              <div class="item-icon bg-green-500"><db-icon /></div>
              <span class="item-label">数据管理</span>
              <div class="item-right"><chevron-right /></div>
            </div>
          </div>

          <!-- 外观 -->
          <div class="card-group mt-8">
            <div class="card-item" @click="activePage = 'appearance'">
              <div class="item-icon bg-indigo-500"><palette-icon /></div>
              <span class="item-label">外观设置</span>
              <div class="item-right"><chevron-right /></div>
            </div>
          </div>

          <div class="version-text">Vinci OS 1.0.2</div>
        </div>
      </div>

      <!-- ===== 外观子页 ===== -->
      <div class="slide-page">
        <div class="sub-nav">
          <button class="sub-back" @click="activePage = 'main'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            设置
          </button>
          <span class="sub-title">外观设置</span>
          <div class="sub-spacer"></div>
        </div>

        <div class="scroll-area">
          <!-- 夜间模式 -->
          <div class="section-label">主题</div>
          <div class="card-group">
            <label class="card-item no-border">
              <div class="item-icon bg-indigo-500">🌙</div>
              <span class="item-label">夜间模式</span>
              <input type="checkbox" v-model="isDarkMode" @change="toggleDarkMode" class="wx-switch" />
            </label>
          </div>

          <!-- 壁纸 -->
          <div class="section-label" style="margin-top:24px">壁纸</div>
          <div class="card-group">
            <label class="card-item">
              <div class="item-icon bg-cyan-500"><img-icon /></div>
              <span class="item-label">桌面壁纸</span>
              <div class="item-right">
                <img v-if="wallpaperPreview" :src="wallpaperPreview" class="preview-thumb" />
                <span class="text-blue">选择图片</span>
                <chevron-right />
              </div>
              <input type="file" accept="image/*" class="hidden-file" @change="onWallpaperUpload" />
            </label>
            <div v-if="wallpaperPreview" class="card-item del-row" @click="clearWallpaper">
              <span style="color:#e64340;font-size:15px">删除壁纸</span>
            </div>
          </div>
          <p class="section-hint">上传自定义图片替换系统默认壁纸。</p>

          <!-- 图标 -->
          <div class="section-label" style="margin-top:24px">自定义 APP 图标</div>
          <div class="card-group">
            <label
              v-for="(app, i) in allApps"
              :key="app.id"
              class="card-item"
              :class="{ 'no-border': i === allApps.length - 1 }"
            >
              <div class="item-icon" :class="app.color">
                <component :is="app.iconComp" />
              </div>
              <span class="item-label">{{ app.name }}</span>
              <div class="item-right">
                <img v-if="customIcons[app.id]" :src="customIcons[app.id]" class="preview-thumb" />
                <span class="text-blue">选择图片</span>
                <chevron-right />
              </div>
              <input type="file" accept="image/*" class="hidden-file" @change="e => onIconUpload(e, app.id)" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== API 方案弹层（竖向页面，用 v-show 覆盖） ===== -->
    <transition name="slide-up">
      <div v-show="activePage === 'api'" class="overlay-page">
        <div class="nav-placeholder">
          <div class="nav-back" @click="activePage = 'main'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            设置
          </div>
          <span class="nav-title-center">聊天 API</span>
          <div style="width:60px"></div>
        </div>
        <div class="scroll-area">
          <div class="card-group">
            <div
              v-for="(p, i) in apiProfiles"
              :key="p.id"
              class="card-item"
              :class="{ 'no-border': i === apiProfiles.length - 1 }"
              @click="editProfile(p)"
            >
              <span class="item-label">{{ p.name }}</span>
              <div class="item-right">
                <span class="item-value">{{ p.model || '' }}</span>
                <chevron-right />
              </div>
            </div>
            <div v-if="!apiProfiles.length" class="empty-row">暂无方案</div>
          </div>
          <button class="action-btn mt-8" @click="newProfile">+ 新建方案</button>
        </div>
      </div>
    </transition>

    <!-- ===== 编辑/新建 API 方案 ===== -->
    <transition name="slide-up">
      <div v-show="activePage === 'editProfile'" class="overlay-page">
        <div class="nav-placeholder">
          <div class="nav-back" @click="activePage = 'api'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            API 方案
          </div>
          <span class="nav-title-center">{{ editingProfile.id ? '编辑方案' : '新建方案' }}</span>
          <div style="width:60px"></div>
        </div>
        <div class="scroll-area">
          <div class="card-group form-group">
            <div class="form-row"><label class="form-label">名称</label><input class="form-input" v-model="editingProfile.name" placeholder="如：GPT-4o" /></div>
            <div class="form-row"><label class="form-label">API Key</label><input class="form-input" type="password" v-model="editingProfile.apiKey" placeholder="sk-..." /></div>
            <div class="form-row"><label class="form-label">Base URL</label><input class="form-input" v-model="editingProfile.baseUrl" placeholder="留空用默认" /></div>
            <div class="form-row"><label class="form-label">模型</label><input class="form-input" v-model="editingProfile.model" placeholder="gpt-4o" /></div>
            <div class="form-row no-border">
              <label class="form-label">API格式</label>
              <select class="form-select" v-model="editingProfile.apiFormat">
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI 兼容</option>
              </select>
            </div>
          </div>
          <button class="action-btn mt-8 green" @click="saveProfile">保存</button>
          <button v-if="editingProfile.id" class="action-btn mt-3 red" @click="deleteProfile">删除方案</button>
        </div>
      </div>
    </transition>

    <!-- ===== MiniMax ===== -->
    <transition name="slide-up">
      <div v-show="activePage === 'minimax'" class="overlay-page">
        <div class="nav-placeholder">
          <div class="nav-back" @click="activePage = 'main'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            设置
          </div>
          <span class="nav-title-center">MiniMax 语音</span>
          <div style="width:60px"></div>
        </div>
        <div class="scroll-area">
          <div class="card-group form-group">
            <div class="form-row"><label class="form-label">API Key</label><input class="form-input" type="password" v-model="globalMinimax.apiKey" placeholder="请输入 API Key" /></div>
            <div class="form-row no-border"><label class="form-label">Group ID</label><input class="form-input" v-model="globalMinimax.groupId" placeholder="请输入 Group ID" /></div>
          </div>
          <button class="action-btn mt-8 green" @click="saveMinimax">保存</button>
        </div>
      </div>
    </transition>

    <!-- ===== 数据管理 ===== -->
    <transition name="slide-up">
      <div v-show="activePage === 'data'" class="overlay-page">
        <div class="nav-placeholder">
          <div class="nav-back" @click="activePage = 'main'">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M9 1L1 8.5L9 16" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
            设置
          </div>
          <span class="nav-title-center">数据管理</span>
          <div style="width:60px"></div>
        </div>
        <div class="scroll-area">
          <div class="card-group">
            <div class="card-item" @click="exportData">
              <div class="item-icon bg-green-500"><db-icon /></div>
              <span class="item-label">导出数据</span>
              <div class="item-right"><chevron-right /></div>
            </div>
            <label class="card-item no-border">
              <div class="item-icon bg-blue-500"><db-icon /></div>
              <span class="item-label">导入数据</span>
              <div class="item-right">
                <span class="text-blue">选择文件</span>
                <chevron-right />
              </div>
              <input type="file" accept=".json" class="hidden-file" @change="importData" />
            </label>
          </div>
          <div v-if="dataMsg" class="msg-row" :class="dataMsg.includes('失败') ? 'err' : 'ok'">{{ dataMsg }}</div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { apiProfileService, roleService, conversationService, messageService } from '../services/db';

const router = useRouter();
const activePage = ref('main'); // main | appearance | api | editProfile | minimax | data

// ---- 图标组件 ----
const mkSvg = (paths, fill = false) => ({
  render() {
    const attrs = fill
      ? { viewBox: '0 0 24 24', fill: 'currentColor', width: 18, height: 18 }
      : { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', width: 18, height: 18 };
    return h('svg', attrs, paths.map(d => h('path', { d })));
  }
});
const mkCircleSvg = (circleCx, circleCy, r, extraPaths = []) => ({
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', width: 18, height: 18 }, [
      h('circle', { cx: circleCx, cy: circleCy, r }),
      ...extraPaths.map(d => h('path', { d }))
    ]);
  }
});

const CpuIcon    = mkSvg(['M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 012 2v4m-6-6v18m0 0H9m6 0h4a2 2 0 002-2v-4m-6 6v-6m0 0H9m6 0v-6M9 9h6v6H9z']);
const MicIcon    = mkSvg(['M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z', 'M19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8']);
const DbIcon     = mkSvg(['M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5z', 'M2 7v5c0 2.76 4.48 5 10 5s10-2.24 10-5V7', 'M2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5']);
const PaletteIcon = mkSvg(['M12 2a10 10 0 100 20 10 10 0 000-20zm-2 14.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 3.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z']);
const ImgIcon    = mkSvg(['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z']);
const ChevRight  = { render() { return h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#c7c7cc', 'stroke-width': '2.5', 'stroke-linecap': 'round' }, [h('path', { d: 'M9 18l6-6-6-6' })]); } };

// app 图标
const mkAppIcon = (paths) => ({ render() { return h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':'2', 'stroke-linecap':'round', 'stroke-linejoin':'round', width:18, height:18 }, paths.map(d=>h('path',{d}))); } });
const WxIco = { render() { return h('svg', { viewBox:'0 0 24 24', fill:'currentColor', width:18, height:18 }, [h('path',{d:'M20.9 10.6C20.9 6.9 17.4 4 13.1 4 8.5 4 4.7 7.2 4.7 11.2c0 2 1 3.8 2.6 5l-.8 2.4 2.7-1.3c.9.3 1.8.4 2.8.4.3 0 .5 0 .8-.1-.2-.5-.3-1.1-.3-1.7 0-3.5 3.1-6.3 6.9-6.3h.5zM10.4 9.3a.9.9 0 110-1.8.9.9 0 010 1.8zm5.2 0a.9.9 0 110-1.8.9.9 0 010 1.8z'}), h('path',{d:'M23 15.9c0-3.1-2.9-5.6-6.4-5.6-3.5 0-6.4 2.5-6.4 5.6s2.9 5.6 6.4 5.6c.8 0 1.5-.1 2.2-.3l2.1 1-.6-1.9C22.2 19.3 23 17.7 23 15.9zm-8.3-1.1a.8.8 0 110-1.6.8.8 0 010 1.6zm3.9 0a.8.8 0 110-1.6.8.8 0 010 1.6z'})]); } };
const GameIco    = mkAppIcon(['M6 12h4m-2-2v4','M2 8a4 4 0 014-4h12a4 4 0 014 4v8a4 4 0 01-4 4H6a4 4 0 01-4-4V8z']);
const LedgerIco  = mkAppIcon(['M12 6v12','M6 12h12','M4.5 4.5h15v15h-15z']);
const PhotoIco   = mkAppIcon(['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z']);
const CameraIco  = mkAppIcon(['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 17a4 4 0 100-8 4 4 0 000 8z']);
const WeatherIco = mkAppIcon(['M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41','M12 8a4 4 0 100 8 4 4 0 000-8z']);
const SettingsIco = { render() { return h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2',width:18,height:18},[h('circle',{cx:'12',cy:'12',r:'3'}),h('path',{d:'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'})]); } };
const PhoneIco   = mkAppIcon(['M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.05a16 16 0 006.86 6.86l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z']);
const BrowserIco = { render() { return h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round',width:18,height:18},[h('circle',{cx:'12',cy:'12',r:'10'}),h('path',{d:'M12 2a14.5 14.5 0 010 20M2 12h20'})]); } };
const MsgIco     = mkAppIcon(['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z']);
const MusicIco   = mkAppIcon(['M9 18V5l12-2v13','M9 18a3 3 0 11-3-3 3 3 0 013 3zm12-2a3 3 0 11-3-3 3 3 0 013 3z']);

const allApps = [
  { id:'wechat',   name:'微信',  color:'bg-green-500',  iconComp: WxIco      },
  { id:'ledger',   name:'账本',  color:'bg-orange-500', iconComp: LedgerIco  },
  { id:'games',    name:'游戏',  color:'bg-purple-500', iconComp: GameIco    },
  { id:'photos',   name:'相册',  color:'bg-blue-400',   iconComp: PhotoIco   },
  { id:'camera',   name:'相机',  color:'bg-gray-500',   iconComp: CameraIco  },
  { id:'weather',  name:'天气',  color:'bg-sky-500',    iconComp: WeatherIco },
  { id:'settings', name:'设置',  color:'bg-gray-600',   iconComp: SettingsIco},
  { id:'phone',    name:'电话',  color:'bg-green-500',  iconComp: PhoneIco   },
  { id:'safari',   name:'浏览器',color:'bg-blue-500',   iconComp: BrowserIco },
  { id:'messages', name:'信息',  color:'bg-green-400',  iconComp: MsgIco     },
  { id:'music',    name:'音乐',  color:'bg-red-500',    iconComp: MusicIco   },
];

// 注册到 template
const CpuIcon2     = CpuIcon;
const MicIcon2     = MicIcon;
const DbIcon2      = DbIcon;
const PaletteIcon2 = PaletteIcon;
const ImgIcon2     = ImgIcon;
const ChevronRight = ChevRight;

// ---- 数据 ----
const apiProfiles  = ref([]);
const editingProfile = ref({ name:'', apiKey:'', baseUrl:'', model:'' });
const globalMinimax  = ref({ apiKey:'', groupId:'' });
const useDirectAPI = ref(false);
const wallpaperPreview = ref('');
const customIcons  = ref({});
const dataMsg = ref('');
const isDarkMode = ref(false);

const loadAll = async () => {
  apiProfiles.value = await apiProfileService.getAll();
  const mm = localStorage.getItem('globalMinimax');
  if (mm) globalMinimax.value = JSON.parse(mm);
  useDirectAPI.value = localStorage.getItem('useDirectAPI') === 'true';
  isDarkMode.value = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode.value) document.documentElement.setAttribute('data-theme', 'dark');
  const wp = localStorage.getItem('desktopWallpaper') || localStorage.getItem('desktop_wallpaper') || '';
  wallpaperPreview.value = wp;
  const icons = {};
  allApps.forEach(a => { icons[a.id] = localStorage.getItem(`icon_${a.id}`) || ''; });
  customIcons.value = icons;
};
onMounted(loadAll);

const toggleDarkMode = () => {
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false');
  if (isDarkMode.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

// ---- API 方案 ----
const editProfile = (p) => { editingProfile.value = { ...p }; activePage.value = 'editProfile'; };
const newProfile  = ()  => { editingProfile.value = { name:'', apiKey:'', baseUrl:'', model:'gpt-4o', apiFormat:'openai' }; activePage.value = 'editProfile'; };
const saveProfile = async () => {
  if (!editingProfile.value.name) { alert('请填写方案名称'); return; }
  if (editingProfile.value.id) await apiProfileService.update(editingProfile.value.id, editingProfile.value);
  else await apiProfileService.create(editingProfile.value);
  await loadAll();
  activePage.value = 'api';
};
const deleteProfile = async () => {
  if (!confirm('删除此方案？')) return;
  await apiProfileService.delete(editingProfile.value.id);
  await loadAll();
  activePage.value = 'api';
};

// ---- MiniMax ----
const saveMinimax = () => {
  localStorage.setItem('globalMinimax', JSON.stringify(globalMinimax.value));
  activePage.value = 'main';
};

// ---- 直接调用API ----
const saveDirectAPI = () => {
  localStorage.setItem('useDirectAPI', useDirectAPI.value ? 'true' : 'false');
};

// ---- 壁纸 ----
const onWallpaperUpload = (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    wallpaperPreview.value = ev.target.result;
    localStorage.setItem('desktopWallpaper', ev.target.result);
    localStorage.setItem('desktop_wallpaper', ev.target.result); // 兼容旧 key
  };
  r.readAsDataURL(file);
  e.target.value = '';
};
const clearWallpaper = () => {
  wallpaperPreview.value = '';
  localStorage.removeItem('desktopWallpaper');
  localStorage.removeItem('desktop_wallpaper');
};

// ---- 图标上传 ----
const onIconUpload = (e, appId) => {
  const file = e.target.files?.[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    customIcons.value[appId] = ev.target.result;
    localStorage.setItem(`icon_${appId}`, ev.target.result);
  };
  r.readAsDataURL(file);
  e.target.value = '';
};

// ---- 数据 ----
const exportData = async () => {
  try {
    const roles = await roleService.getAll();
    const conversations = await conversationService.getAll();
    const allMessages = [];
    for (const c of conversations) {
      const msgs = await messageService.getByConversation(c.id);
      allMessages.push(...msgs);
    }
    const blob = new Blob([JSON.stringify({ version:2, exportedAt:new Date().toISOString(),
      userProfile: JSON.parse(localStorage.getItem('userProfile')||'{}'),
      globalMinimax: JSON.parse(localStorage.getItem('globalMinimax')||'{}'),
      roles, conversations, messages: allMessages }, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `小手机备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    dataMsg.value = '导出成功！';
  } catch(e) { dataMsg.value = '导出失败: '+e.message; }
  setTimeout(() => { dataMsg.value = ''; }, 3000);
};
const importData = async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.roles) throw new Error('格式不正确');
    if (!confirm('确认导入？将覆盖现有数据。')) return;
    if (data.userProfile)   localStorage.setItem('userProfile',   JSON.stringify(data.userProfile));
    if (data.globalMinimax) localStorage.setItem('globalMinimax', JSON.stringify(data.globalMinimax));
    const Dexie = (await import('dexie')).default;
    const db = new Dexie('XiaoShouJiDB');
    db.version(2).stores({ roles:'++id,name,createdAt,updatedAt', conversations:'++id,roleId,updatedAt,isTop,isMuted', messages:'++id,conversationId,timestamp', apiProfiles:'++id,name,createdAt' });
    await db.roles.bulkPut(data.roles);
    await db.conversations.bulkPut(data.conversations);
    await db.messages.bulkPut(data.messages);
    dataMsg.value = '导入成功！请刷新页面。';
  } catch(e) { dataMsg.value = '导入失败: '+e.message; }
  e.target.value = '';
};
</script>

<style scoped>
.page {
  width: 100%;
  height: 100dvh;
  background: #f2f2f7;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 水平滑动容器（主页 ↔ 外观） */
.slide-container {
  display: flex;
  width: 200%;
  height: 100%;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  will-change: transform;
}
.slide-page {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f2f2f7;
}

/* 垂直覆盖页（其它子页） */
.overlay-page {
  position: absolute;
  inset: 0;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  z-index: 20;
}
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.28s cubic-bezier(.4,0,.2,1); }
.slide-up-enter-from { transform: translateX(100%); }
.slide-up-leave-to   { transform: translateX(100%); }

/* 导航栏 */
.nav-placeholder {
  height: 44px;
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 8px;
  padding-right: 16px;
  background: #f2f2f7;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
}
.nav-back {
  display: flex; align-items: center; gap: 2px;
  color: #007aff; font-size: 17px; cursor: pointer; min-width: 60px;
}
.nav-title-center {
  font-size: 17px; font-weight: 600; color: #111; position: absolute; left: 0; right: 0; text-align: center; pointer-events: none;
}
.sub-nav {
  height: 44px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 8px 0 8px;
  background: #f2f2f7;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0; position: relative;
}
.sub-back {
  display: flex; align-items: center; gap: 2px;
  color: #007aff; font-size: 17px; background: none; border: none; cursor: pointer; min-width: 60px;
}
.sub-title {
  position: absolute; left: 0; right: 0; text-align: center;
  font-size: 17px; font-weight: 600; color: #111; pointer-events: none;
}
.sub-spacer { width: 60px; }

/* 滚动区 */
.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: max(40px, env(safe-area-inset-bottom));
}
.scroll-area::-webkit-scrollbar { display: none; }

/* 大标题 */
.big-title { font-size: 32px; font-weight: 700; color: #000; padding: 20px 20px 8px; }

/* 分组卡片 */
.card-group {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}
.mt-8 { margin-top: 32px; }
.mt-3 { margin-top: 12px; }

.card-item {
  display: flex; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer; position: relative;
}
.card-item:last-child, .card-item.no-border { border-bottom: none; }
.card-item:active { background: #f5f5f5; }
.del-row { justify-content: center; }

.item-icon {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: white; margin-right: 14px; flex-shrink: 0;
}
.item-label { font-size: 17px; color: #000; flex: 1; }
.item-right { display: flex; align-items: center; gap: 4px; }
.item-value { font-size: 15px; color: #8e8e93; }
.text-blue { font-size: 15px; color: #007aff; }
.preview-thumb { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; margin-right: 4px; }
.hidden-file { display: none; }

/* 分组标题 */
.section-label { font-size: 13px; color: #8e8e93; padding: 16px 32px 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.section-hint { font-size: 13px; color: #8e8e93; padding: 4px 32px 0; line-height: 1.5; }

/* 表单 */
.form-group .form-row {
  display: flex; align-items: center; padding: 13px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.form-group .form-row.no-border { border-bottom: none; }
.form-label { font-size: 15px; color: #111; min-width: 72px; flex-shrink: 0; }
.form-input { flex: 1; border: none; outline: none; font-size: 15px; color: #333; text-align: right; background: transparent; font-family: inherit; }
.form-input::placeholder { color: #c7c7cc; }
.form-select { flex: 1; border: none; outline: none; font-size: 15px; color: #333; text-align: right; background: transparent; font-family: inherit; appearance: none; }

/* 按钮 */
.action-btn {
  display: block; width: calc(100% - 32px); margin: 0 16px;
  padding: 14px; background: #007aff; color: #fff;
  border: none; border-radius: 12px; font-size: 17px; cursor: pointer;
}
.action-btn.green { background: #34c759; }
.action-btn.red   { background: #ff3b30; }

/* 消息 */
.msg-row { padding: 8px 20px; font-size: 13px; text-align: center; }
.msg-row.ok  { color: #34c759; }
.msg-row.err { color: #ff3b30; }
.empty-row   { padding: 14px 16px; font-size: 15px; color: #c7c7cc; text-align: center; }

.version-text { text-align: center; font-size: 13px; color: #c7c7cc; margin-top: 48px; padding-bottom: 16px; }

/* Tailwind 颜色类 */
.bg-blue-500  { background: #3b82f6; }
.bg-orange-500{ background: #f97316; }
.bg-green-500 { background: #22c55e; }
.bg-indigo-500{ background: #6366f1; }
.bg-cyan-500  { background: #06b6d4; }
.bg-purple-500{ background: #a855f7; }
.bg-blue-400  { background: #60a5fa; }
.bg-gray-500  { background: #6b7280; }
.bg-sky-500   { background: #0ea5e9; }
.bg-gray-600  { background: #4b5563; }
.bg-green-400 { background: #4ade80; }
.bg-red-500   { background: #ef4444; }

/* Switch 开关 */
.wx-switch {
  position: relative; width: 46px; height: 26px; appearance: none;
  background-color: #e5e5e5; border-radius: 13px; outline: none; cursor: pointer;
  transition: background-color 0.3s; margin: 0; flex-shrink: 0;
}
.wx-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 22px; height: 22px;
  background-color: #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: transform 0.3s;
}
.wx-switch:checked { background-color: #07c160; }
.wx-switch:checked::after { transform: translateX(20px); }
</style>
