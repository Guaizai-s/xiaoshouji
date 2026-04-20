<template>
  <div class="h-screen w-full flex flex-col relative font-sans transition-colors duration-500" :class="t.appBg">
    
    <!-- 顶部状态栏留白 (适配刘海屏) -->
    <div class="h-12 w-full absolute top-0 z-20 backdrop-blur-md transition-colors" :class="t.headerBg"></div>

    <!-- Header 导航栏 -->
    <div class="pt-12 pb-3 px-4 flex items-center justify-between z-20 sticky top-0 backdrop-blur-md border-b transition-colors duration-500 shrink-0" 
         :class="[t.headerBg, t.border]">
      <button @click="goBack" class="p-2 -ml-2 rounded-full transition-colors flex items-center" :class="[t.textMuted, `hover:${t.textMain}`]">
        <i class="ph ph-caret-left text-2xl"></i>
      </button>
      <div class="text-[17px] font-semibold tracking-wide transition-colors" :class="t.textMain">{{ viewTitle }}</div>
      <div class="w-10"></div> <!-- 占位符保证标题居中 -->
    </div>

    <!-- 滚动内容区 -->
    <div class="flex-1 overflow-x-hidden relative">
      <transition name="slide" mode="out-in">
        
        <!-- ================= 主页视图 ================= -->
        <div v-if="currentView === 'main'" class="absolute inset-0 overflow-y-auto pb-12 px-5 scrollbar-hide">
          
          <!-- 顶部角色信息 (Ins风大头像) -->
          <div class="flex flex-col items-center mt-6 mb-8">
            <div class="w-24 h-24 rounded-full overflow-hidden shadow-sm mb-3 border-2 flex items-center justify-center transition-colors duration-500" :class="[t.border, t.iconBg]">
              <img v-if="role.avatar" :src="role.avatar" class="w-full h-full object-cover">
              <i v-else class="ph ph-user text-4xl" :class="t.textMuted"></i>
            </div>
            <h2 class="text-[22px] font-semibold tracking-tight transition-colors" :class="t.textMain">{{ role.name || '未命名角色' }}</h2>
            <span class="text-[13px] mt-1 cursor-pointer transition-colors" :class="t.textMuted">编辑角色设定</span>
          </div>

          <!-- 外观设置 -->
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">Appearance</div>
          <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            <div @click="currentView = 'theme'" class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors" :class="t.iconBg">
                  <i class="ph ph-palette text-[18px]" :class="t.textMain"></i>
                </div>
                <span class="text-[15px] font-medium transition-colors" :class="t.textMain">主题风格</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[14px] transition-colors" :class="t.textMuted">{{ themes[activeTheme]?.name || '默认' }}</span>
                <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
              </div>
            </div>
          </div>

          <!-- 聊天行为 -->
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">Chat Behavior</div>
          <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            
            <!-- 置顶聊天 -->
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">置顶聊天</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.isTop" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors duration-300" :class="settings.isTop ? t.switchBg : (activeTheme === 'midnight' ? '!bg-[#333]' : '!bg-[#E5E5E5]')"></div>
              </label>
            </div>
            
            <div class="h-[1px] mx-4 transition-colors" :class="t.border"></div>
            
            <!-- 消息免打扰 -->
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">消息免打扰</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.isMuted" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors duration-300" :class="settings.isMuted ? t.switchBg : (activeTheme === 'midnight' ? '!bg-[#333]' : '!bg-[#E5E5E5]')"></div>
              </label>
            </div>

            <div class="h-[1px] mx-4 transition-colors" :class="t.border"></div>
            
            <!-- 真实时间感知 -->
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">真实时间感知</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.isRealTimeOn" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors duration-300" :class="settings.isRealTimeOn ? t.switchBg : (activeTheme === 'midnight' ? '!bg-[#333]' : '!bg-[#E5E5E5]')"></div>
              </label>
            </div>
            
          </div>

          <!-- 记忆与上下文 -->
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">Memory & Context</div>
          <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            <div @click="currentView = 'memory'" class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">记忆设置</span>
              <div class="flex items-center gap-2">
                <span class="text-[14px] transition-colors" :class="t.textMuted">长期 / 核心</span>
                <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
              </div>
            </div>
            
            <div class="h-[1px] mx-4 transition-colors" :class="t.border"></div>
            
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl transition-colors">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">上下文长度</span>
              <span class="text-[14px] font-medium transition-colors" :class="t.textMuted">{{ settings.contextLength || 15 }} 轮</span>
            </div>
            <div class="px-4 pb-4 pt-1">
              <input type="range" min="1" max="100" v-model.number="settings.contextLength" 
                     class="w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none transition-colors"
                     :class="[t.iconBg]" 
                     :style="`background: linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${settings.contextLength}%, transparent ${settings.contextLength}%, transparent 100%);`" />
            </div>
          </div>

          <!-- API 与其他 (可继续扩展) -->
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">Integration</div>
          <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-8" :class="[t.cardBg, t.border]">
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">API 方案</span>
              <div class="flex items-center gap-2">
                <span class="text-[14px] transition-colors" :class="t.textMuted">全局配置</span>
                <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
              </div>
            </div>
            
            <div class="h-[1px] mx-4 transition-colors" :class="t.border"></div>
            
            <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">Minimax 音色</span>
              <div class="flex items-center gap-2">
                <span class="text-[14px] transition-colors" :class="t.textMuted">未配置</span>
                <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
              </div>
            </div>
          </div>
          
        </div>

        <!-- ================= 主题设置视图 ================= -->
        <div v-else-if="currentView === 'theme'" class="absolute inset-0 overflow-y-auto pb-12 px-5 scrollbar-hide">
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 mt-6 transition-colors" :class="t.textMuted">Select Theme</div>
          
          <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            <div v-for="(theme, key) in themes" :key="key" 
                 @click="activeTheme = key"
                 class="flex justify-between items-center px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300"
                 :class="[`hover:${t.hoverBg}`]">
              
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center"
                     :class="[theme.appBg, theme.id === 'midnight' ? 'border-[#333]' : 'border-stone-200']">
                  <div class="w-5 h-5 rounded-full" :class="theme.switchBg.replace('!', '')"></div>
                </div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium transition-colors" :class="t.textMain">{{ theme.name }}</span>
                  <span class="text-[12px] transition-colors" :class="t.textMuted">{{ theme.desc }}</span>
                </div>
              </div>

              <!-- 选中打勾 -->
              <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                   :class="activeTheme === key ? t.switchBg : 'border-2 ' + t.border">
                <i v-if="activeTheme === key" class="ph-bold ph-check text-white text-[14px]" :class="activeTheme === 'midnight' ? '!text-[#121212]' : ''"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= 记忆设置视图 ================= -->
        <div v-else-if="currentView === 'memory'" class="absolute inset-0 overflow-y-auto pb-12 px-5 scrollbar-hide">
          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 mt-6 transition-colors" :class="t.textMuted">长期记忆 (Long Term)</div>
          <div class="rounded-[1.5rem] p-4 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            <textarea v-model="settings.longTermMemory" rows="4"
              placeholder="每行一条记忆，例如：&#10;· 用户喜欢喝咖啡&#10;· 用户叫小明，18岁"
              class="w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed transition-colors placeholder-opacity-50"
              :class="[t.textMain, `placeholder-${t.textMuted.replace('text-', '')}`]"
            ></textarea>
          </div>

          <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">核心记忆 (Core)</div>
          <div class="rounded-[1.5rem] p-4 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
            <textarea v-model="settings.coreMemory" rows="6"
              placeholder="填写角色设定、用户画像等核心信息，每次对话都会发送给 AI。"
              class="w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed transition-colors placeholder-opacity-50"
              :class="[t.textMain, `placeholder-${t.textMuted.replace('text-', '')}`]"
            ></textarea>
          </div>

          <button class="w-full py-4 rounded-[1.25rem] font-semibold text-[16px] shadow-sm transition-all active:scale-95"
                  :class="[t.switchBg, activeTheme === 'midnight' ? '!text-[#121212]' : 'text-white']"
                  @click="goBack">
            保存设置
          </button>
        </div>

      </transition>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// import { useRouter } from 'vue-router'; // 实际项目中解除注释

// const router = useRouter();

// ================== 视图与主题控制 ==================
const currentView = ref('main');
const activeTheme = ref('blanc'); // 后续可以绑定到你的全局配置库 (Pinia 等)

// 核心三色主题设计 Token
const themes = {
  blanc: {
    id: 'blanc', name: 'Blanc 灰白', desc: '清冷高级画廊风',
    appBg: 'bg-[#F9F9F9]', headerBg: 'bg-[#F9F9F9]/85', cardBg: 'bg-white',
    textMain: 'text-[#222222]', textMuted: 'text-[#A0A0A0]',
    border: 'border-[#EAEAEA]', hoverBg: 'bg-[#F4F4F4]', iconBg: 'bg-[#F0F0F0]',
    switchBg: '!bg-[#222222]' // 强调色
  },
  vanilla: {
    id: 'vanilla', name: 'Vanilla 奶茶', desc: '温暖治愈奶油风',
    appBg: 'bg-[#F2EEE9]', headerBg: 'bg-[#F2EEE9]/85', cardBg: 'bg-[#FAF8F5]',
    textMain: 'text-[#4A433E]', textMuted: 'text-[#A39A8F]',
    border: 'border-[#E2DCD5]', hoverBg: 'bg-[#EAE4DD]', iconBg: 'bg-[#EAE4DD]',
    switchBg: '!bg-[#B4A79A]' // 强调色
  },
  midnight: {
    id: 'midnight', name: 'Midnight 夜间', desc: '深邃暗夜护眼风',
    appBg: 'bg-[#121212]', headerBg: 'bg-[#121212]/85', cardBg: 'bg-[#1C1C1C]',
    textMain: 'text-[#F5F5F5]', textMuted: 'text-[#777777]',
    border: 'border-[#2A2A2A]', hoverBg: 'bg-[#252525]', iconBg: 'bg-[#2A2A2A]',
    switchBg: '!bg-[#E0E0E0]' // 强调色
  }
};

const t = computed(() => themes[activeTheme.value]);

const sliderColor = computed(() => {
  if (activeTheme.value === 'blanc') return '#222222';
  if (activeTheme.value === 'vanilla') return '#B4A79A';
  return '#E0E0E0';
});

const viewTitle = computed(() => {
  const map = { main: '详细信息', theme: '主题风格', memory: '记忆设置' };
  return map[currentView.value] || '设置';
});

// ================== 数据状态 (待接入接口) ==================
const role = ref({
  name: '',
  avatar: ''
});

const settings = ref({
  isTop: false,
  isMuted: false,
  isRealTimeOn: true,
  contextLength: 15,
  longTermMemory: '',
  coreMemory: ''
});

// ================== 方法 ==================
const goBack = () => {
  if (currentView.value !== 'main') {
    currentView.value = 'main';
  } else {
    // router.back(); // 实际项目中解除注释
    console.log('触发路由返回');
  }
};
</script>

<style scoped>
/* 隐藏滚动条但保持可滚动 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 页面切换滑入滑出过渡效果 */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from { 
  transform: translateX(100%); 
  opacity: 0; 
}
.slide-leave-to { 
  transform: translateX(-30%); 
  opacity: 0; 
}
</style>