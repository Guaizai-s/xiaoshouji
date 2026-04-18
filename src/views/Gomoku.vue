<template>
  <div class="gomoku-page" :class="currentTheme">
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </div>
      <div class="nav-title">五子棋</div>
      <div style="width: 24px"></div>
    </div>

    <div class="game-container">
      
      <div class="player-info top-player" :class="{ 'is-turn': currentPlayer === 2 }">
        <div class="avatar-box ai-avatar" :style="aiRole?.avatar ? `background-image:url(${aiRole.avatar});background-size:cover` : ''">
          {{ aiRole?.avatar ? '' : (aiRole?.name?.[0] || '机') }}
        </div>
        <div class="info-text">
          <div class="name">{{ aiRole?.name || '云端 AI' }} <span class="tag">执白</span></div>
          <div class="status">{{ isAiThinking ? '正在思考...' : aiStatus }}</div>
        </div>
        <div class="piece-indicator white-piece"></div>
      </div>

      <div class="board-wrapper">
        <div class="board">
          <div 
            v-for="row in 15" :key="'row-'+row" 
            class="board-row"
          >
            <div 
              v-for="col in 15" :key="'col-'+col" 
              class="board-cell"
              @click="placePiece(row - 1, col - 1)"
            >
              <div v-if="isStarPoint(row - 1, col - 1)" class="star-point"></div>
              
              <transition name="pop">
                <div 
                  v-if="boardData[row - 1][col - 1] !== 0" 
                  class="chess-piece"
                  :class="boardData[row - 1][col - 1] === 1 ? 'black' : 'white'"
                >
                  <div v-if="lastMove.r === row - 1 && lastMove.c === col - 1" class="last-move-mark"></div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <div class="theme-selector">
        <div 
          class="theme-btn" 
          :class="{ active: currentTheme === 'theme-minimal' }"
          @click="currentTheme = 'theme-minimal'"
        >属性</div>
        <div 
          class="theme-btn" 
          :class="{ active: currentTheme === 'theme-simulation' }"
          @click="currentTheme = 'theme-simulation'"
        >仿真</div>
        <div 
          class="theme-btn" 
          :class="{ active: currentTheme === 'theme-data' }"
          @click="currentTheme = 'theme-data'"
        >数据流</div>
      </div>

      <div class="player-info bottom-player" :class="{ 'is-turn': currentPlayer === 1 }">
        <div class="piece-indicator black-piece"></div>
        <div class="info-text right-align">
          <div class="name">小苏 <span class="tag">执黑</span></div>
          <div class="status">{{ gameOver ? aiStatus : (currentPlayer === 1 ? '该你落子了' : '等待 AI...') }}</div>
        </div>
        <div class="avatar-box user-avatar">Me</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { roleService, apiProfileService } from '../services/db.js';
import { callClaude } from '../services/claude.js';

const router = useRouter();
const route = useRoute();

// ✨ 主题默认选为属性
const currentTheme = ref('theme-minimal');
const boardData = ref(Array.from({ length: 15 }, () => Array(15).fill(0)));
const currentPlayer = ref(1);
const lastMove = ref({ r: -1, c: -1 });
const aiRole = ref(null);
const aiStatus = ref('等待中');
const isAiThinking = ref(false);
const gameOver = ref(false);

onMounted(async () => {
  const roleId = Number(route.query.roleId);
  if (roleId) {
    const role = await roleService.getById(roleId);
    if (role?.apiProfileId) {
      const profile = await apiProfileService.getById(role.apiProfileId);
      if (profile) {
        aiRole.value = { ...role, apiKey: profile.apiKey, baseUrl: profile.baseUrl, model: profile.model, apiFormat: profile.apiFormat };
      }
    }
  }
});

const isStarPoint = (r, c) => {
  const points = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
  return points.some(p => p[0] === r && p[1] === c);
};

const checkWin = (board, r, c, player) => {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let d = 1; d <= 4; d++) { const nr = r+dr*d, nc = c+dc*d; if (nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==player) break; count++; }
    for (let d = 1; d <= 4; d++) { const nr = r-dr*d, nc = c-dc*d; if (nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==player) break; count++; }
    if (count >= 5) return true;
  }
  return false;
};

const boardToText = () => {
  const symbols = ['.', '●', '○'];
  const header = '   ' + Array.from({length:15}, (_,i) => String(i).padStart(2)).join('');
  const rows = boardData.value.map((row, r) => {
    const cells = row.map((v, c) => {
      if (lastMove.value.r === r && lastMove.value.c === c) return v === 1 ? ' ▲' : ' △';
      return ' ' + symbols[v];
    }).join('');
    return String(r).padStart(2) + ' ' + cells;
  });
  return [header, ...rows].join('\n');
};

const askAI = async () => {
  if (!aiRole.value) return;
  isAiThinking.value = true;
  aiStatus.value = '正在思考...';
const systemPrompt = `你是一位五子棋高手，正在与人类对弈。

【游戏规则】
- 棋盘为15×15，行列均从0到14
- 黑子(●/▲)先手，白子(○/△)后手，你执白子
- 任意方向连续5子即获胜

【你的思考协议（极其重要）】
在给出坐标前，你必须先进行局势分析，按以下优先级：
1. 致命威胁：检查黑子（●）是否有“冲四”或“活三”，如果有，必须立刻给出防守坐标！
2. 绝杀机会：检查自己（○）是否有机会连成五子。
3. 布局发展：如果没有紧急威胁，寻找能让自己连成更多子的位置。

【输出格式】
分析过程请简短地写在文字里，最后**必须**在结尾单独另起一行，只输出坐标格式：row,col。
例如：
防守对方的活三威胁。
7,8`;
  const board = boardToText();
  const userMsg = `当前棋盘（共${boardData.value.flat().filter(v=>v!==0).length}子已落）：\n\n${board}\n\n请给出你的落子坐标（row,col）：`;

  try {
    const reply = await callClaude(
      { ...aiRole.value, systemPrompt },
      [{ role: 'user', content: userMsg }]
    );
    const matches = [...reply.matchAll(/(\d+)\s*[,，]\s*(\d+)/g)];
    const match = matches[matches.length - 1];
    if (match) {
      const r = parseInt(match[1]), c = parseInt(match[2]);
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && boardData.value[r][c] === 0) {
        boardData.value[r][c] = 2;
        lastMove.value = { r, c };
        if (checkWin(boardData.value, r, c, 2)) { gameOver.value = true; aiStatus.value = `${aiRole.value.name} 获胜！`; return; }
      }
    }
  } catch (e) {
    aiStatus.value = 'AI出错，请重试';
  } finally {
    if (!gameOver.value) { currentPlayer.value = 1; isAiThinking.value = false; aiStatus.value = '等待中'; }
  }
};

const placePiece = async (r, c) => {
  if (boardData.value[r][c] !== 0 || currentPlayer.value !== 1 || isAiThinking.value || gameOver.value) return;
  boardData.value[r][c] = 1;
  lastMove.value = { r, c };
  if (checkWin(boardData.value, r, c, 1)) { gameOver.value = true; aiStatus.value = '你获胜了！'; return; }
  currentPlayer.value = 2;
  await askAI();
};
</script>

<style scoped>
/* ====================
   主题 1：属性风 (Minimal) 默认
==================== */
.gomoku-page {
  --bg-color: #f5f4ed;
  --card-bg: #f5f4ed;
  --accent-color: #d97757;
  --text-main: #5c504d;
  --text-sub: #9e938f;
  
  --board-bg: var(--card-bg);
  --board-line: #dcd8cc; 
  --board-border: transparent;
  --board-shadow: 0 10px 30px rgba(217, 119, 87, 0.08);
  
  --piece-black-bg: radial-gradient(circle at 30% 30%, #5c504d, #2a2423);
  --piece-black-shadow: 0 4px 6px rgba(0, 0, 0, 0.409);
  --piece-white-bg: radial-gradient(circle at 30% 30%, #ffffff, #c9c6bb);
  --piece-white-shadow: 0 4px 6px rgba(26, 25, 25, 0.559);
  --mark-color: #ff4757;
  
  width: 100%; height: 100dvh;
  background: var(--bg-color); color: var(--text-main);
  display: flex; flex-direction: column;
  transition: all 0.4s ease;
}

/* ====================
   主题 2：仿真风 (Simulation)
==================== */
.theme-simulation {
  --board-bg: #dcb37b; /* 木纹底色 */
  --board-line: rgba(77, 47, 15, 0.6); /* 深木色划线 */
  --board-border: #b58852;
  --board-shadow: 0 16px 40px rgba(139, 90, 43, 0.3), inset 0 0 40px rgba(139, 90, 43, 0.1);
  --board-texture: repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 2px, transparent 2px, transparent 6px);
  
  --piece-black-bg: radial-gradient(circle at 35% 35%, #4a4a4a, #0a0a0a);
  --piece-black-shadow: 2px 4px 8px rgba(0, 0, 0, 0.4);
  --piece-white-bg: radial-gradient(circle at 35% 35%, #ffffff, #d6d6d6);
  --piece-white-shadow: 2px 4px 8px rgba(0, 0, 0, 0.2);
  --mark-color: #e74c3c;
}

/* ====================
   主题 3：数据流风 (Data) 莫兰迪赛博
==================== */
.theme-data {
  --bg-color: #2a2d34;
  --card-bg: #353941;
  --accent-color: #64ffda; /* 莫兰迪青绿 */
  --text-main: #e0e6ed;
  --text-sub: #8892b0;
  
  --board-bg: #22252b;
  --board-line: rgba(100, 255, 218, 0.15); 
  --board-border: rgba(100, 255, 218, 0.3);
  --board-shadow: 0 0 30px rgba(100, 255, 218, 0.05);
  
  --piece-black-bg: transparent;
  /* 数据流的黑子用柔和发光红圈代替 */
  --piece-black-border: 2px solid #ff8888;
  --piece-black-shadow: 0 0 10px rgba(255,136,136,0.3), inset 0 0 10px rgba(255,136,136,0.2);
  
  --piece-white-bg: transparent;
  /* 白子用青绿圈代替 */
  --piece-white-border: 2px solid #64ffda;
  --piece-white-shadow: 0 0 10px rgba(100,255,218,0.3), inset 0 0 10px rgba(100,255,218,0.2);
  --mark-color: #ffffff;
}

/* 基础布局 */
.nav-bar {
  padding: env(safe-area-inset-top) 20px 10px;
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600;
}
.nav-back { color: var(--accent-color); cursor: pointer; }

.game-container {
  flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; padding: 20px;
}

/* 玩家信息卡片 */
.player-info {
  display: flex; align-items: center; gap: 16px; padding: 14px 20px;
  background: var(--card-bg); border-radius: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04); transition: all 0.3s ease;
}
.theme-data .player-info { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
.player-info.is-turn {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
  border: 1px solid var(--accent-color);
}

.avatar-box {
  width: 50px; height: 50px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;
}
.ai-avatar { background: rgba(0,0,0,0.05); color: var(--text-main); }
.theme-data .ai-avatar { background: rgba(255,255,255,0.1); }
.user-avatar { background: var(--accent-color); color: #222; }

.info-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.info-text.right-align { text-align: right; }
.name { font-size: 16px; font-weight: 700; }
.tag { font-size: 10px; padding: 2px 6px; background: rgba(0,0,0,0.08); border-radius: 6px; margin-left: 4px;}
.theme-data .tag { background: rgba(255,255,255,0.1); }
.status { font-size: 12px; color: var(--text-sub); }

.piece-indicator { width: 22px; height: 22px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.black-piece { background: var(--piece-black-bg, #3d3432); border: var(--piece-black-border, none); box-shadow: var(--piece-black-shadow); }
.white-piece { background: var(--piece-white-bg, #fff); border: var(--piece-white-border, 1px solid #ddd); box-shadow: var(--piece-white-shadow); }

/* ====================
   ✨ 核心重构：交叉点网格
==================== */
.board-wrapper {
  width: 100%; aspect-ratio: 1;
  background-color: var(--board-bg);
  background-image: var(--board-texture, none);
  border: 3px solid var(--board-border);
  border-radius: 12px; padding: 16px;
  box-shadow: var(--board-shadow);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.4s ease;
}

.board {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
}

.board-row { flex: 1; display: flex; }

.board-cell {
  flex: 1; position: relative; cursor: pointer; -webkit-tap-highlight-color: transparent;
}

/* 利用伪元素画出每个格子中间的“十”字，拼接成完美的交叉线棋盘 */
.board-cell::before { /* 横线 */
  content: ''; position: absolute;
  top: 50%; left: 0; right: 0; height: 1px;
  background: var(--board-line); transform: translateY(-50%); z-index: 1;
}
.board-cell::after { /* 竖线 */
  content: ''; position: absolute;
  top: 0; bottom: 0; left: 50%; width: 1px;
  background: var(--board-line); transform: translateX(-50%); z-index: 1;
}

/* 修剪边缘，让线不出头 */
.board-row:first-child .board-cell::after { top: 50%; }
.board-row:last-child .board-cell::after { bottom: 50%; }
.board-cell:first-child::before { left: 50%; }
.board-cell:last-child::before { right: 50%; }

/* 星位点 */
.star-point {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 6px; height: 6px; border-radius: 50%; z-index: 2;
  background: var(--board-line);
}
.theme-data .star-point { background: var(--accent-color); box-shadow: 0 0 6px var(--accent-color); }

/* 棋子：直接占满单元格居中，自然就在交叉线上 */
.chess-piece {
  position: absolute;
  top: 7%; left: 7%; width: 86%; height: 86%;
  border-radius: 50%; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.chess-piece.black {
  background: var(--piece-black-bg);
  border: var(--piece-black-border, none);
  box-shadow: var(--piece-black-shadow);
}
.chess-piece.white {
  background: var(--piece-white-bg);
  border: var(--piece-white-border, none);
  box-shadow: var(--piece-white-shadow);
}

.last-move-mark {
  width: 6px; height: 6px; background: var(--mark-color); border-radius: 50%;
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
}

/* 动画 */
.pop-enter-active { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from { transform: scale(0); opacity: 0; }
@keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

/* 主题切换按钮 */
.theme-selector {
  display: flex; justify-content: center; padding: 6px; border-radius: 20px; margin: 0 20px;
  background: rgba(0,0,0,0.04);
}
.theme-data .theme-selector { background: rgba(255,255,255,0.05); }

.theme-btn {
  flex: 1; text-align: center; padding: 10px 0; font-size: 13px; font-weight: 600;
  color: var(--text-sub); border-radius: 14px; cursor: pointer; transition: all 0.2s;
}
.theme-btn.active {
  background: var(--card-bg); color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.theme-data .theme-btn.active { box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
</style>