<template>
  <!-- 外层容器：占满屏幕，随主题切换背景 -->
  <div class="sms-profile-page w-full flex flex-col relative font-sans transition-colors duration-500" :class="[t.appBg, t.backgroundFx]">
    
    <!-- 顶部状态栏留白 (适配刘海屏) -->
    <div class="h-10 w-full absolute top-0 z-20 backdrop-blur-md transition-colors duration-500" :class="t.headerBg"></div>

    <!-- Header 标题栏 -->
    <div class="pt-12 pb-2 px-5 flex items-center justify-between z-10 sticky top-0 transition-colors duration-500 shrink-0 border-b" :class="[t.headerBg, t.border]">
      <h1 class="text-[26px] font-semibold tracking-tight transition-colors" :class="t.textMain">Profile</h1>
      <div class="flex items-center gap-4">
      </div>
    </div>

    <!-- 滚动区域 -->
    <div class="flex-1 overflow-y-auto px-5 pb-28 scrollbar-hide">
      
      <!-- 顶部个人信息 (大头像) -->
      <div class="flex flex-col items-center mt-6 mb-8">
        <div class="relative">
          <div class="w-24 h-24 rounded-full overflow-hidden shadow-sm border-2 flex items-center justify-center transition-colors duration-500" :class="[t.border, t.iconBg]">
            <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover">
            <i v-else class="ph ph-user text-4xl" :class="t.textMuted"></i>
          </div>
          <!-- 编辑小按钮 -->
          <button @click="triggerAvatarUpload"
                  class="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm"
                  :class="[t.cardBg, t.border, t.textMain, `hover:${t.searchBg}`]">
            <i class="ph ph-pencil-simple text-[14px]"></i>
          </button>
          <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange">
        </div>
        <input v-model="user.name" @blur="save" placeholder="未设置昵称"
               class="bg-transparent text-center outline-none text-[22px] font-semibold tracking-tight mt-4 transition-colors w-full" :class="t.textMain">
        <input v-model="user.bio" @blur="save" placeholder="点击设置你的个性签名"
               class="bg-transparent text-center outline-none text-[13px] mt-1 transition-colors w-full" :class="t.textMuted">
      </div>

      <!-- ================= 主题风格设置 ================= -->
      <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">Appearance</div>
      <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
        <div v-for="(theme, key) in themes" :key="key" 
             @click="setTheme(key)"
             class="flex justify-between items-center px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300"
             :class="[`hover:${t.hoverBg}`]">
          
          <div class="flex items-center gap-4">
            <!-- 主题色预览圆点 -->
            <div class="w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center transition-colors duration-500"
                 :class="[theme.appBg, theme.previewFx, theme.id === 'midnight' ? 'border-[#333]' : 'border-stone-200']">
              <div class="w-5 h-5 rounded-full shadow-inner" :class="theme.switchBg.replace('!', '')"></div>
            </div>
            <div class="flex flex-col">
              <span class="text-[15px] font-medium transition-colors" :class="t.textMain">{{ theme.name }}</span>
              <span class="text-[12px] transition-colors" :class="t.textMuted">{{ theme.desc }}</span>
            </div>
          </div>

          <!-- 选中状态打勾 -->
          <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
               :class="activeTheme === key ? t.switchBg : 'border-2 ' + t.border">
            <i v-if="activeTheme === key" class="ph-bold ph-check text-white text-[14px]" :class="activeTheme === 'midnight' ? '!text-[#121212]' : ''"></i>
          </div>
        </div>
      </div>

      <!-- ================= 人设管理 ================= -->
      <div class="text-[12px] font-bold tracking-widest uppercase mb-2 ml-2 transition-colors" :class="t.textMuted">My Persona</div>
      <div class="rounded-[1.5rem] p-1.5 shadow-sm border transition-colors duration-500 mb-6" :class="[t.cardBg, t.border]">
        
        <!-- 当前使用的人设 -->
        <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors" :class="t.iconBg">
              <i class="ph ph-identification-card text-[18px]" :class="t.textMain"></i>
            </div>
            <span class="text-[15px] font-medium transition-colors" :class="t.textMain">当前人设</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[14px] transition-colors" :class="t.textMuted">{{ user.currentPersona || '未选择' }}</span>
            <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
          </div>
        </div>
        
        <div class="h-[1px] mx-4 transition-colors" :class="t.border"></div>
        
        <!-- 管理人设库 -->
        <div class="flex justify-between items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-colors" :class="[`hover:${t.hoverBg}`]">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors" :class="t.iconBg">
              <i class="ph ph-books text-[18px]" :class="t.textMain"></i>
            </div>
            <span class="text-[15px] font-medium transition-colors" :class="t.textMain">人设卡库管理</span>
          </div>
          <i class="ph ph-caret-right text-sm" :class="t.textMuted"></i>
        </div>
      </div>

    </div>

    <!-- 底部导航栏 (Tab Bar) -->
<div class="sms-bottom-nav pt-4 pb-4 px-6 backdrop-blur-xl border-t transition-colors duration-500 flex justify-between items-center"
         :class="[t.tabBg, t.headerBorder]">

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted" @click="router.replace('/messages')">
        <i class="ph ph-chat-circle text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted">
        <i class="ph ph-users text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted">
        <i class="ph ph-compass text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMain">
        <div class="w-7 h-7 rounded-full overflow-hidden border border-current flex items-center justify-center">
          <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover">
          <svg v-else viewBox="0 0 28 28" class="w-full h-full"><circle cx="14" cy="10" r="5" fill="currentColor"/><path d="M4 24c0-5.5 4.5-9 10-9s10 3.5 10 9" fill="currentColor"/></svg>
        </div>
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '../composables/useTheme.js';

const router = useRouter();
const { activeTheme, themes, t, setTheme } = useTheme();

const user = ref({ name: '', bio: '', avatar: '', currentPersona: '' });
const avatarInput = ref(null);

onMounted(() => {
  const saved = localStorage.getItem('smsUserProfile');
  if (saved) user.value = { ...user.value, ...JSON.parse(saved) };
});

// ================== 页面逻辑方法 ==================

const save = () => localStorage.setItem('smsUserProfile', JSON.stringify(user.value));

const triggerAvatarUpload = () => avatarInput.value?.click();

const onAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { user.value.avatar = ev.target.result; save(); };
  reader.readAsDataURL(file);
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

/* 适配 iOS 底部安全区 */
.sms-profile-page {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.sms-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  box-sizing: border-box;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
</style>
