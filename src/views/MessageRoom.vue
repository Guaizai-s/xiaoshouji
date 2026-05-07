<template>
  <div class="h-screen w-full flex flex-col relative font-sans transition-colors duration-500 page-spring-enter-active" :class="t.appBg">

    <div class="h-8 w-full backdrop-blur-md absolute top-0 z-20 transition-colors duration-500" :class="t.headerBg"></div>

    <div class="pt-10 pb-3 px-4 flex items-center justify-between backdrop-blur-md z-10 border-b shrink-0 transition-colors duration-500"
         :class="[t.headerBg, t.headerBorder]">
      <div class="flex-1 flex justify-start">
        <button class="p-2 -ml-2 transition-all duration-200 flex items-center active:scale-90" :class="[t.textMuted, `hover:${t.textMain}`]" @click="router.back()">
          <i class="ph ph-caret-left text-2xl"></i>
        </button>
      </div>
      
      <div class="flex flex-col items-center flex-[2]">
        <h1 class="text-[17px] font-semibold tracking-wide transition-colors truncate max-w-full" :class="t.textMain">{{ role?.name || '...' }}</h1>
        <span class="text-[11px] font-medium tracking-wider transition-colors" :class="t.textMuted">在线</span>
      </div>

      <div class="flex-1 flex justify-end">
        <button class="p-2 -mr-2 transition-all duration-200 flex items-center active:scale-90" :class="[t.textMuted, `hover:${t.textMain}`]" @click="router.push(`/messages/details/${roleId}`)">
          <i class="ph ph-dots-three text-[26px]"></i>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
      <transition-group name="msg-spring" tag="div" class="flex flex-col space-y-6">
        <div v-for="(msg, index) in messages" :key="msg.id">
          
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
              
              <div v-if="msg.audioUrl" 
                   @click="togglePlay(msg)"
                   class="flex items-center gap-2.5 px-4 py-2.5 shadow-sm cursor-pointer transition-all duration-300 active:scale-95"
                   :class="[
                     msg.role === 'user' ? `${t.myBubble} rounded-[1.25rem] rounded-br-sm` : `${t.otherBubble} rounded-[1.25rem] rounded-bl-sm`
                   ]">
                
                <i class="ph-fill transition-all" :class="activeAudioId === msg.id ? 'ph-pause-circle text-[22px]' : 'ph-play-circle text-[22px]'"></i>
                
                <div class="flex items-center gap-[3px] h-4 mx-1">
                  <span class="w-[3px] rounded-full bg-current transition-all duration-200" :class="activeAudioId === msg.id ? 'wave-anim-1' : 'h-1.5'"></span>
                  <span class="w-[3px] rounded-full bg-current transition-all duration-200" :class="activeAudioId === msg.id ? 'wave-anim-2' : 'h-3'"></span>
                  <span class="w-[3px] rounded-full bg-current transition-all duration-200" :class="activeAudioId === msg.id ? 'wave-anim-3' : 'h-2'"></span>
                  <span class="w-[3px] rounded-full bg-current transition-all duration-200" :class="activeAudioId === msg.id ? 'wave-anim-4' : 'h-3.5'"></span>
                  <span class="w-[3px] rounded-full bg-current transition-all duration-200" :class="activeAudioId === msg.id ? 'wave-anim-2' : 'h-2'"></span>
                </div>
                
                <span class="text-[13px] font-medium tracking-wide"></span>
              </div>

              <div v-if="msg.audioUrl && isTranscriptVisible(msg.id)"
                   class="mt-2 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap transition-colors duration-500 shadow-sm"
                   :class="[
                     msg.role === 'user' ? `${t.myBubble} rounded-[1.25rem] rounded-br-sm` : `${t.otherBubble} rounded-[1.25rem] rounded-bl-sm`
                   ]">
                {{ msg.content }}
              </div>

              <template v-else-if="!msg.audioUrl">
                <div v-for="(part, partIndex) in getMessageParts(msg)"
                     :key="`${msg.id}-${partIndex}`"
                     class="px-4 py-3 text-[15px] leading-relaxed transition-colors duration-500 shadow-sm"
                     :class="[
                       partIndex > 0 ? 'mt-2' : '',
                       msg.role === 'user' ? `${t.myBubble} rounded-[1.25rem] rounded-br-sm` : `${t.otherBubble} rounded-[1.25rem] rounded-bl-sm`
                     ]">
                  {{ part }}
                </div>
              </template>
              
              <span class="text-[10px] mt-1 px-1 transition-colors duration-500" :class="t.textMuted">
                {{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
          </div>
        </div>
      </transition-group>
      
      <div ref="messagesEndRef" class="h-2"></div>
    </div>

    <div class="px-4 py-3 border-t shrink-0 safe-area-pb transition-colors duration-500" :class="[t.inputAreaBg, t.headerBorder]">
      <div class="flex items-center gap-3">
        <button class="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 shrink-0" 
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
          <button class="ml-2 transition-all duration-200 active:scale-90 flex items-center" :class="[t.textMuted, `hover:${t.textMain}`]">
            <i class="ph ph-smiley text-xl"></i>
          </button>
        </div>

        <button v-if="inputText.trim()"
                @click="handleSend"
                class="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-[0.85] shrink-0 shadow-sm"
                :class="t.sendBtn">
          <i class="ph-fill ph-paper-plane-tilt text-lg ml-0.5"></i>
        </button>
        
        <button v-else 
                class="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 shrink-0"
                :class="[t.textMuted, t.iconBtnBg]">
          <i class="ph ph-microphone text-xl"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { roleService, conversationService, messageService, apiProfileService } from '../services/db.js';
import { callClaude } from '../services/claude.js';
import { textToSpeech } from '../services/minimax.js'; // 引入语音服务
import { useTheme } from '../composables/useTheme.js';
import { buildEnhancedSystemPrompt } from '../utils/promptBuilder.js';
import { parseMessageDirectives } from '../utils/directiveParser.js';

const route = useRoute();
const router = useRouter();
const roleId = parseInt(route.params.id);

const role = ref(null);
const messages = ref([]);
const inputText = ref('');
const { t, activeTheme } = useTheme();
const messagesEndRef = ref(null);

const showAvatar = (index) => index === 0 || messages.value[index - 1].role === 'user';
const isTyping = ref(false);
let convId = null;

// ================= 语音播放控制 =================
const activeAudioId = ref(null);
const visibleTranscriptIds = ref(new Set());
let currentAudioPlayer = null;

const togglePlay = (msg) => {
  if (!msg.audioUrl) return;

  const nextTranscriptIds = new Set(visibleTranscriptIds.value);
  if (nextTranscriptIds.has(msg.id)) {
    nextTranscriptIds.delete(msg.id);
  } else {
    nextTranscriptIds.add(msg.id);
  }
  visibleTranscriptIds.value = nextTranscriptIds;

  if (activeAudioId.value === msg.id) {
    // 暂停当前播放
    if (currentAudioPlayer) currentAudioPlayer.pause();
    activeAudioId.value = null;
  } else {
    // 播放新的语音
    if (currentAudioPlayer) {
      currentAudioPlayer.pause();
    }
    currentAudioPlayer = new Audio(msg.audioUrl);
    activeAudioId.value = msg.id;
    currentAudioPlayer.play();
    
    // 播放结束恢复静止状态
    currentAudioPlayer.onended = () => {
      activeAudioId.value = null;
    };
  }
};

const isTranscriptVisible = (id) => visibleTranscriptIds.value.has(id);

const getMessageParts = (msg) => {
  if (msg.type !== 'text' || msg.audioUrl) return [msg.content];
  return (msg.content || '').split('\n').map(part => part.trim()).filter(Boolean);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 离开页面时停止播放
onUnmounted(() => {
  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
  }
});
// ==============================================

const shouldShowTime = (index) => {
  if (index === 0) return true;
  const currentMsgTime = messages.value[index].timestamp;
  const previousMsgTime = messages.value[index - 1].timestamp;
  if (!currentMsgTime || !previousMsgTime) return false;
  return (currentMsgTime - previousMsgTime) > 5 * 60 * 1000;
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const timeStr = `${hours}:${minutes} ${ampm}`;
  return isToday ? `今天 ${timeStr}` : `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
};

onMounted(async () => {
  let r = await roleService.getById(roleId);
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
  nextTick(() => messagesEndRef.value?.scrollIntoView({ behavior: 'instant' }));
};

watch(messages, () => scrollToBottom(), { deep: true });

const createAssistantTextMessages = async (text) => {
  const parts = (text || '').split('\n').map(part => part.trim()).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) await sleep(500);
    const aiMsg = await messageService.create(convId, 'assistant', parts[i], 'text', null);
    messages.value.push(aiMsg);
  }
};

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || !convId) return;
  inputText.value = '';

  const userMsg = await messageService.create(convId, 'user', text);
  messages.value.push(userMsg);

  isTyping.value = true;
  try {
    const contextLength = role.value?.chatSettings?.contextLength || 15;
    const contextMessages = await messageService.getCombinedContext(roleId, contextLength);

    const combined = contextMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const roleWithTime = {
      ...role.value,
      systemPrompt: await buildEnhancedSystemPrompt(role.value, contextMessages)
    };

    const reply = await callClaude(roleWithTime, combined);
    const parsedReply = parseMessageDirectives(reply);
    const voiceDirective = parsedReply.directives.find(directive => directive.type === 'voice');
    let audioUrl = null;

    if (voiceDirective) {
      try {
        const voiceSettings = role.value?.chatSettings || {};
        // 请求语音接口生成 audioUrl
        audioUrl = await textToSpeech(voiceDirective.text, {
          voiceId: voiceSettings.minimaxVoiceId,
          model: voiceSettings.minimaxModel,
          speed: voiceSettings.minimaxSpeed,
          pitch: voiceSettings.minimaxPitch
        });
      } catch (e) {
        console.warn('语音生成失败:', e.message);
      }
      
      // 创建一条带有 audioUrl 的消息
      const aiMsg = await messageService.create(convId, 'assistant', voiceDirective.text || '语音消息', 'text', audioUrl);
      messages.value.push(aiMsg);

    }

    await createAssistantTextMessages(parsedReply.cleanText);

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
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.safe-area-pb { padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)); }

/* ================= 页面与列表动画 ================= */
.page-spring-enter-active {
  animation: page-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes page-spring-in {
  0% { opacity: 0; transform: translateY(15px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.msg-spring-enter-active {
  animation: msg-spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.msg-spring-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes msg-spring-in {
  0% { opacity: 0; transform: translateY(20px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* ================= 语音波纹动画 ================= */
.wave-anim-1 { animation: wave 1s infinite ease-in-out; }
.wave-anim-2 { animation: wave 1s infinite ease-in-out 0.2s; }
.wave-anim-3 { animation: wave 1s infinite ease-in-out 0.4s; }
.wave-anim-4 { animation: wave 1s infinite ease-in-out 0.1s; }

@keyframes wave {
  0%, 100% { height: 6px; }
  50% { height: 16px; }
}
</style>
