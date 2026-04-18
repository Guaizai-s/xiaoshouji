<template>
  <div class="games-page">
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </div>
      <div style="width: 24px"></div>
    </div>

    <div class="game-list-container">
      <div class="game-list">
        <div 
          v-for="(game, index) in gameList" 
          :key="game.id"
          class="game-card-wrapper"
          :style="{ top: `${index * 40}px`, zIndex: index }"
        >
          <div class="game-card animate-bounce-in" :style="{ '--delay': `${index * 0.12}s` }" @click="openRoleSelect(game)">
            <div class="game-icon-box">
              <component :is="game.iconComp" class="game-icon-svg" />
            </div>
            
            <div class="game-info">
              <div class="game-name">{{ game.name }}</div>
              <div class="game-status">
                <span class="tag">{{ game.desc }}</span>
                <div class="go-btn">
                  开始 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-spacer"></div>
      </div>
    </div>

    <transition name="drawer">
      <div v-if="showRoleSelect" class="drawer-overlay" @click.self="showRoleSelect = false">
        <div class="role-drawer">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <h3>选择对战角色</h3>
            <span class="sub">{{ selectedGame?.name }}</span>
          </div>
          
          <div class="role-list">
            <div
              v-for="role in roles"
              :key="role.id"
              class="role-card"
              :class="{ active: selectedRoleId === role.id }"
              @click="selectedRoleId = role.id"
            >
              <div class="avatar-circle" :style="role.avatar ? `background-image:url(${role.avatar});background-size:cover` : ''">{{ role.avatar ? '' : role.name[0] }}</div>
              <div class="name">{{ role.name }}</div>
            </div>
            <div v-if="roles.length === 0" style="color:#9e938f;font-size:13px;padding:10px 0">暂无可用角色，请先在联系人中添加角色并配置 API</div>
          </div>
          
          <button class="launch-btn" @click="startGame">确认并进入游戏</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { roleService, apiProfileService } from '../services/db.js';

const router = useRouter();

// 图标工厂
const mkIcon = (paths) => ({
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, paths.map(d => h('path', { d })));
  }
});

const gameList = ref([
  { id: 'gomoku', name: '五子棋', desc: '2人对弈', iconComp: mkIcon(['M3 3h18v18H3z', 'M3 9h18', 'M3 15h18', 'M9 3v18', 'M15 3v18']) },
  { id: 'wolf', name: '狼人杀', desc: '5人烧脑', iconComp: mkIcon(['M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5']) },
  { id: 'mahjong', name: '麻将', desc: '4人搓牌', iconComp: mkIcon(['M7 8h10M7 12h10M7 16h10']) },
  { id: 'uno', name: 'UNO 扑克', desc: '多人群聚', iconComp: mkIcon(['M4 4h16v16H4z', 'M9 9l6 6M15 9l-6 6']) },
]);

const showRoleSelect = ref(false);
const selectedGame = ref(null);
const roles = ref([]);
const selectedRoleId = ref(null);

onMounted(async () => {
  const allRoles = await roleService.getAll();
  // 只保留有 apiProfileId 的角色（能调用 API 的）
  const withProfile = await Promise.all(allRoles.map(async r => {
    if (!r.apiProfileId) return null;
    const profile = await apiProfileService.getById(r.apiProfileId);
    return profile ? { ...r, apiKey: profile.apiKey, baseUrl: profile.baseUrl, model: profile.model, apiFormat: profile.apiFormat } : null;
  }));
  roles.value = withProfile.filter(Boolean);
});

const openRoleSelect = (game) => {
  selectedGame.value = game;
  showRoleSelect.value = true;
};

const startGame = () => {
  if (!selectedRoleId.value) { alert('请选择一个 AI 角色'); return; }
  const role = roles.value.find(r => r.id === selectedRoleId.value);
  showRoleSelect.value = false;
  if (selectedGame.value?.id === 'gomoku') {
    router.push({ path: '/games/gomoku', query: { roleId: role.id } });
  } else {
    alert(`${selectedGame.value?.name} 暂未开放`);
  }
};
</script>

<style scoped>
.games-page {
  --bg: #f5f4ed;
  --card: #faf9f5;
  --accent: #d97757;
  --text: #5c504d;
  --sub: #9e938f;
  
  width: 100%;
  height: 100dvh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.nav-bar {
  padding: env(safe-area-inset-top) 20px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg);
  z-index: 100;
}
.nav-back { color: var(--accent); cursor: pointer; }
.nav-title { font-weight: 600; font-size: 17px; }

/* 核心滚动区域 */
.game-list-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; 
  padding: 10px 20px 0; 
.game-list-container::-webkit-scrollbar { display: none; }
}
.game-list {
  display: block; 
  position: relative;
}

/* 堆叠外壳：利用 sticky */
.game-card-wrapper {
  position: sticky;
  margin-bottom: 20px; /* 卡片之间的初始间距 */
  margin-top: -15px;
}

.game-card {
  background: var(--card);
  border-radius: 28px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 10px 30px rgba(217, 119, 87, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.game-card:active {
  transform: scale(0.95);
  background: #fff;
}

.game-icon-box {
  width: 64px; height: 64px;
  background: var(--bg);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
}
.game-icon-svg { width: 30px; height: 30px; }

.game-info { flex: 1; }
.game-name { font-size: 20px; font-weight: 700; margin-bottom: 6px; }

.game-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tag {
  font-size: 12px;
  color: var(--sub);
  background: rgba(0, 0, 0, 0.03);
  padding: 3px 10px;
  border-radius: 8px;
}
.go-btn {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  display: flex; align-items: center; gap: 4px;
}

footer-spacer {
  height: 80vh; 
  pointer-events: none;
}
/* 进场弹跳动画 */
.animate-bounce-in {
  animation: bounceIn 0.8s cubic-bezier(0.17, 0.89, 0.32, 1.28) both;
  animation-delay: var(--delay);
}
@keyframes bounceIn {
  from { opacity: 0; transform: translateY(50px) scale(0.85); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 角色抽屉样式 */
.drawer-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(5px);
  z-index: 200;
  display: flex; align-items: flex-end;
}
.role-drawer {
  width: 100%;
  background: var(--bg);
  border-radius: 32px 32px 0 0;
  padding: 12px 24px 40px;
}
.drawer-handle {
  width: 40px; height: 5px; background: #e0ddd0;
  border-radius: 3px; margin: 0 auto 20px;
}
.drawer-header h3 { font-size: 20px; margin-bottom: 4px; }
.drawer-header .sub { color: var(--sub); font-size: 14px; }

.role-list {
  display: flex; gap: 20px; margin: 30px 0;
}
.role-card {
  flex: 1; padding: 20px; background: var(--card); border-radius: 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  border: 2px solid transparent;
}
.role-card.active { border-color: var(--accent); }
.avatar-circle {
  width: 54px; height: 54px; border-radius: 27px;
  background: #e8e6dc; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 20px;
}
.add-ai .avatar-circle { background: var(--accent); color: white; }

.launch-btn {
  width: 100%; padding: 18px; border-radius: 20px; border: none;
  background: var(--accent); color: white; font-weight: 700; font-size: 17px;
}

/* 抽屉动效 */
.drawer-enter-active, .drawer-leave-active { transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateY(100%); opacity: 0; }
</style>