<template>
  <!-- 外层容器：占满屏幕，随主题切换背景 -->
  <div class="sms-home-page w-full flex flex-col relative font-sans transition-colors duration-500" :class="[t.appBg, t.backgroundFx]">

    <!-- 顶部状态栏留白 (适配刘海屏) -->
    <div class="h-10 w-full shrink-0 z-20"></div>

    <!-- Header 标题栏 -->
    <div class="pt-6 pb-2 px-5 flex items-center justify-between z-10 shrink-0 transition-colors duration-500" :class="t.appBg">
      <h1 class="text-[26px] font-semibold tracking-tight transition-colors" :class="t.textMain">Messages</h1>
      <div class="flex items-center gap-4">
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="px-5 py-3 z-10 shrink-0 transition-colors duration-500" :class="t.appBg">
      <div class="flex items-center rounded-[1rem] px-4 py-2.5 transition-all duration-300" :class="t.searchBg">
        <i class="ph ph-magnifying-glass text-lg mr-2 transition-colors" :class="t.textMuted"></i>
        <input 
          type="text" 
          placeholder="Search..." 
          class="flex-1 bg-transparent text-[15px] outline-none transition-colors"
          :class="[t.textMain, `placeholder-${t.textMuted.replace('text-', '')}`]"
        />
      </div>
    </div>

    <!-- 消息列表滚动区域 -->
    <div class="flex-1 overflow-y-auto px-3 pt-2 pb-24 scrollbar-hide">
      <div v-if="smsList.length === 0" class="flex flex-col items-center justify-center h-40">
        <span class="text-[13px]" :class="t.textMuted">暂无短信，点击右下角 + 开始对话</span>
      </div>
      <div v-for="conv in smsList" :key="conv.id"
           class="flex items-center gap-4 px-2 py-3.5 rounded-2xl cursor-pointer transition-colors duration-300"
           :class="[`hover:${t.searchBg}`]"
           @click="router.push(`/messages/${conv.role?.id}`)">

        <!-- 头像区域 -->
        <div class="relative w-12 h-12 shrink-0">
          <img v-if="conv.role?.avatar" :src="conv.role.avatar" class="w-full h-full rounded-full object-cover">
          <div v-else class="w-full h-full rounded-full flex items-center justify-center" :class="t.searchBg">
            <i class="ph ph-user text-xl" :class="t.textMuted"></i>
          </div>
        </div>

        <!-- 文本区域 -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex justify-between items-baseline mb-1">
            <h3 class="text-[15px] truncate transition-colors"
                :class="t.textMain"
                :style="conv.unread ? 'font-weight: 600;' : 'font-weight: 500;'">
              {{ conv.role?.name || '未知角色' }}
            </h3>
            <span class="text-[11px] shrink-0 transition-colors" :class="conv.unread ? t.textMain : t.textMuted">
              {{ conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <p class="text-[13px] truncate pr-4 transition-colors"
               :class="conv.unread ? t.textMain : t.textMuted"
               :style="conv.unread ? 'font-weight: 500;' : ''">
              {{ conv.lastMessage || '暂无消息' }}
            </p>
            <div v-if="conv.unread" class="w-2.5 h-2.5 rounded-full shrink-0 transition-colors" :class="t.ringActive"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 (点击空白关闭弹窗) -->
    <div v-if="showActionMenu" @click="showActionMenu = false" class="absolute inset-0 z-20"></div>

    <!-- 弹出的操作容器 (给角色发送信息) -->
<transition name="spring-pop">
      <div v-show="showActionMenu"
           class="absolute bottom-[5.5rem] right-6 w-56 rounded-[1.5rem] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border z-30 backdrop-blur-xl origin-bottom-right"
           :class="[t.tabBg, t.headerBorder]">
        <div class="px-2 pb-2 mb-2 border-b" :class="t.headerBorder">
          <span class="text-[13px] font-semibold tracking-wide" :class="t.textMain">新建对话</span>
        </div>
        <div class="flex flex-col gap-1 mt-1 max-h-64 overflow-y-auto">
          <div v-if="roles.length === 0" class="py-4 text-center text-[12px]" :class="t.textMuted">暂无角色</div>
          <button v-for="role in roles" :key="role.id"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            :class="[`hover:${t.searchBg}`]"
            @click="startMessage(role)">
            <img v-if="role.avatar" :src="role.avatar" class="w-8 h-8 rounded-full object-cover shrink-0">
            <div v-else class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="t.searchBg">
              <i class="ph ph-user text-[16px]" :class="t.textMain"></i>
            </div>
            <span class="text-[14px] font-medium truncate" :class="t.textMain">{{ role.name }}</span>
          </button>
        </div>
      </div>
    </transition>
    <!-- 右下角悬浮加号按钮 (FAB) -->
    <button @click="showActionMenu = !showActionMenu"
            class="absolute bottom-24 right-5 w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center z-30 transition-all duration-300 active:scale-95 hover:scale-105"
            :class="[t.ringActive, activeTheme === 'midnight' ? 'text-[#121212]' : 'text-white']">
      <i class="ph ph-plus text-[28px]" :style="{ transform: showActionMenu ? 'rotate(45deg) scale(1.15)' : 'rotate(0deg) scale(1)', transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }"></i>
    </button>

    <!-- 底部导航栏 (Tab Bar) -->
<div class="sms-bottom-nav pt-4 pb-4 px-6 backdrop-blur-xl border-t transition-colors duration-500 flex justify-between items-center"
         :class="[t.tabBg, t.headerBorder]">
      
      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMain">
        <i class="ph-fill ph-chat-circle text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted">
        <i class="ph ph-users text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted">
        <i class="ph ph-compass text-[26px]"></i>
      </button>

      <button class="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90" :class="t.textMuted" @click="router.replace('/messages/profile')">
        <div class="w-7 h-7 rounded-full overflow-hidden border border-current flex items-center justify-center">
          <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover">
          <svg v-else viewBox="0 0 28 28" class="w-full h-full" :class="t.textMuted"><circle cx="14" cy="10" r="5" fill="currentColor"/><path d="M4 24c0-5.5 4.5-9 10-9s10 3.5 10 9" fill="currentColor"/></svg>
        </div>
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { roleService, conversationService } from '../services/db.js';
import { useTheme } from '../composables/useTheme.js';

const router = useRouter();
const { activeTheme, t } = useTheme();
const roles = ref([]);
const smsList = ref([]);
const userAvatar = ref('');
const showActionMenu = ref(false);

onMounted(async () => {
  roles.value = await roleService.getAll();
  smsList.value = await conversationService.getAllSms();
  const saved = localStorage.getItem('smsUserProfile');
  if (saved) userAvatar.value = JSON.parse(saved).avatar || '';
});

const startMessage = async (role) => {
  showActionMenu.value = false;
  await conversationService.getOrCreateSms(role.id);
  smsList.value = await conversationService.getAllSms();
  router.push(`/messages/${role.id}`);
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
.sms-home-page {
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
/* 弹出框果冻跳动动画 */
.spring-pop-enter-active {
  animation: spring-pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.spring-pop-leave-active {
  animation: spring-pop-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes spring-pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spring-pop-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}
</style>
