<template>
  <div class="h-screen w-full flex flex-col relative font-sans transition-colors duration-500" :class="t.appBg">

    <div class="h-8 w-full backdrop-blur-md absolute top-0 z-20 transition-colors duration-500" :class="t.headerBg"></div>

    <div class="pt-10 pb-3 px-4 flex items-center justify-between backdrop-blur-md z-10 border-b shrink-0 transition-colors duration-500"
         :class="[t.headerBg, t.headerBorder]">
      <button class="p-2 -ml-2 transition-colors flex items-center" :class="[t.textMuted, `hover:${t.textMain}`]" @click="router.back()">
        <i class="ph ph-caret-left text-2xl"></i>
      </button>
      
      <div class="flex flex-col items-center">
        <h1 class="text-[17px] font-semibold tracking-wide transition-colors" :class="t.textMain">{{ role?.name || '...' }}</h1>
        <span class="text-[11px] font-medium tracking-wider transition-colors" :class="t.textMuted">在线</span>
      </div>

      <div class="flex items-center gap-3">
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
      
      <template v-for="(msg, index) in messages" :key="msg.id">
        
        <div v-if="shouldShowTime(index)" class="flex justify-center mt-2 mb-4">
          <span class="text-[11px] font-medium px-3 py-1 rounded-full transition-colors"
                :class="[t.textMuted, activeTheme === 'midnight' ? 'bg-white/5' : 'bg-black/5']">
            {{ formatMessageTime(msg.timestamp) }}
          </span>
        </div>

        <div class="flex items-end gap-2" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div v-if="msg.role !== 'user'" class="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1">
            <img v-if="showAvatar(index)" :src="role?.avatar" alt="avatar" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-transparent"></div>
          </div>

          <div class="flex flex-col max-w-[75%]" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
            <div class="px-4 py-3 text-[15px] leading-relaxed transition-colors duration-500"
                 :class="[
                   msg.role === 'user'
                     ? `${t.myBubble} rounded-[1.25rem] rounded-br-sm`
                     : `${t.otherBubble} rounded-[1.25rem] rounded-bl-sm`
                 ]">
              {{ msg.content }}
            </div>
            <span class="text-[10px] mt-1 px-1 transition-colors duration-500" :class="t.textMuted">
              {{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </template>
      
      <div ref="messagesEndRef" class="h-2"></div>
    </div>

    <div class="px-4 py-3 border-t shrink-0 safe-area-pb transition-colors duration-500" :class="[t.inputAreaBg, t.headerBorder]">
      <div class="flex items-center gap-3">
        <button class="w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0" 
                :class="[t.textMuted, t.iconBtnBg]">
          <i class="ph ph-plus text-xl"></i>
        </button>
        
        <div class="flex-1 flex items-center rounded-full px-4 py-2 border transition-all duration-300"
             :class="t.inputBg">
          <input 
            type="text" 
            placeholder="发消息..." 
            class="flex-1 bg-transparent text-[15px] outline-none transition-colors"
            :class="t.textMain"
            v-model="inputText"
            @keypress.enter="handleSend"
          />
          <button class="ml-2 transition-colors flex items-center" :class="[t.textMuted, `hover:${t.textMain}`]">
            <i class="ph ph-smiley text-xl"></i>
          </button>
        </div>

        <button v-if="inputText.trim()"
                @click="handleSend"
                class="w-9 h-9 flex items-center justify-center rounded-full transition-colors shrink-0 shadow-sm"
                :class="t.sendBtn">
          <i class="ph-fill ph-paper-plane-tilt text-lg ml-0.5"></i>
        </button>
        
        <button v-else 
                class="w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0"
                :class="[t.textMuted, t.iconBtnBg]">
          <i class="ph ph-microphone text-xl"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { roleService, conversationService, messageService, apiProfileService } from '../services/db.js';
import { callClaude } from '../services/claude.js';
import { useTheme } from '../composables/useTheme.js';

const route = useRoute();
const router = useRouter();
const roleId = parseInt(route.params.id);

const role = ref(null);
const messages = ref([]);
const inputText = ref('');
// 引入 activeTheme，用于判断夜间模式调整时间标签背景
const { t, activeTheme } = useTheme();
// 定义滚动锚点 ref
const messagesEndRef = ref(null);

const showAvatar = (index) => index === 0 || messages.value[index - 1].role === 'user';

const isTyping = ref(false);
let convId = null;

// ================= 时间分割线逻辑 =================
const shouldShowTime = (index) => {
  if (index === 0) return true; // 第一条消息必定显示时间
  
  const currentMsgTime = messages.value[index].timestamp;
  const previousMsgTime = messages.value[index - 1].timestamp;
  
  // 如果前后两条消息相差超过 5 分钟 (300000 毫秒)，则显示时间
  if (!currentMsgTime || !previousMsgTime) return false;
  return (currentMsgTime - previousMsgTime) > 5 * 60 * 1000;
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; 
  
  const timeStr = `${hours}:${minutes} ${ampm}`;
  
  if (isToday) {
    return `今天 ${timeStr}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
  }
};
// =================================================

onMounted(async () => {
  let r = await roleService.getById(roleId);
  // 合并 API 配置（与 ChatRoom 保持一致）
  if (r?.apiProfileId) {
    const profile = await apiProfileService.getById(r.apiProfileId);
    if (profile) r = { ...r, apiKey: profile.apiKey, baseUrl: profile.baseUrl, model: profile.model, apiFormat: profile.apiFormat };
  } else {
    const profiles = await apiProfileService.getAll();
    if (profiles.length > 0) r = { ...r, apiKey: profiles[0].apiKey, baseUrl: profiles[0].baseUrl, model: profiles[0].model, apiFormat: profiles[0].apiFormat };
  }
  role.value = r;
  const conv = await conversationService.getOrCreateSms(roleId);
  convId = conv.id;
  messages.value = await messageService.getByConversation(convId);
  scrollToBottom();
});

const scrollToBottom = () => {
  nextTick(() => messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' }));
};

watch(messages, () => scrollToBottom(), { deep: true });

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || !convId) return;
  inputText.value = '';

  const userMsg = await messageService.create(convId, 'user', text);
  messages.value.push(userMsg);

  // 构建上下文：短信记录 + 微信记录（共享人设，不显示微信消息）
  isTyping.value = true;
  try {
    // 获取微信会话上下文（同角色，非sms）
    const allConvs = await conversationService.getAll();
    const chatConv = allConvs.find(c => c.roleId === roleId && !c.source);
    const chatCtx = chatConv ? await messageService.getContext(chatConv.id, 10) : [];
    const smsCtx = await messageService.getContext(convId, 10);

    // 合并上下文：微信在前（作为背景），短信在后（当前对话）
    const combined = [
      ...chatCtx.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      ...smsCtx.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
    ];

    const reply = await callClaude(role.value, combined);
    const aiMsg = await messageService.create(convId, 'assistant', reply);
    messages.value.push(aiMsg);
  } catch (e) {
    console.error('AI回复失败:', e);
    const errMsg = { id: Date.now(), role: 'assistant', content: `[回复失败: ${e.message}]`, timestamp: Date.now() };
    messages.value.push(errMsg);
  } finally {
    isTyping.value = false;
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

/* 适配 iOS 底部安全区 */
.safe-area-pb {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}
</style>