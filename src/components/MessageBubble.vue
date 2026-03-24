<template>
  <div class="wx-message-wrapper" :class="{ self: message.role === 'user' }">
    <!-- 如果是文本消息且包含换行，分割成多个气泡 -->
    <template v-if="message.type === 'text' && messageParts.length > 1">
      <div
        v-for="(part, index) in messageParts"
        :key="index"
        class="wx-message"
        :class="{ self: message.role === 'user' }"
      >
        <img
          class="wx-message-avatar"
          :src="avatar"
          alt="avatar"
        />
        <div class="wx-message-content">
          <div class="wx-message-bubble text" v-html="parseEmoji(part)"></div>
        </div>
      </div>
    </template>
    <!-- 单条消息 -->
    <template v-else>
      <div class="wx-message" :class="{ self: message.role === 'user' }">
        <img
          class="wx-message-avatar"
          :src="avatar"
          alt="avatar"
        />
        <div class="wx-message-content">
          <div
            class="wx-message-bubble"
            :class="message.type"
          >
            <template v-if="message.type === 'text'">
              <span v-html="parseEmoji(message.content)"></span>
              <div v-if="message.audioUrl" class="audio-player" @click="toggleAudio">
                <span class="audio-icon">{{ isPlaying ? '⏸' : '▶️' }}</span>
                <span class="audio-text">语音消息</span>
              </div>
            </template>
            <template v-else-if="message.type === 'image'">
              <img :src="message.content" alt="image" />
            </template>
            <template v-else-if="message.type === 'sticker'">
              <img :src="message.content" alt="sticker" />
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  roleAvatar: {
    type: String,
    default: ''
  }
});

const isPlaying = ref(false);
const audioElement = ref(null);

const toggleAudio = () => {
  if (!props.message.audioUrl) return;

  if (!audioElement.value) {
    audioElement.value = new Audio(props.message.audioUrl);
    audioElement.value.onended = () => { isPlaying.value = false; };
  }

  if (isPlaying.value) {
    audioElement.value.pause();
    isPlaying.value = false;
  } else {
    audioElement.value.play();
    isPlaying.value = true;
  }
};

const avatar = computed(() => {
  return props.message.role === 'user' ? props.userAvatar : props.roleAvatar;
});

// 分割消息（按换行符）
const messageParts = computed(() => {
  if (props.message.type !== 'text') return [props.message.content];
  // 按换行符分割，过滤空行
  return props.message.content.split('\n').filter(part => part.trim());
});

// 解析表情标签 [表情：xxx] -> <img src="/emojis/xxx.png">
const parseEmoji = (text) => {
  if (!text) return '';
  // 匹配 [表情：xxx] 或 [表情:xxx] 格式
  return text.replace(/\[表情[：:]\s*([^\]]+)\]/g, (match, emojiName) => {
    const name = emojiName.trim();
    return `<img class="emoji-img" src="/emojis/${name}.png" alt="${name}" onerror="this.style.display='none';this.parentNode.innerHTML+=this.alt" />`;
  });
};
</script>

<style scoped>
.wx-message-wrapper {
  display: flex;
  flex-direction: column;
  animation: popIn 0.2s ease-out both;
}

.wx-message-wrapper.self {
  align-items: flex-end;
}

@keyframes popIn {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}

.wx-message-avatar-placeholder {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.wx-message.self .wx-message-avatar-placeholder {
  margin-left: 8px;
}

.wx-message:not(.self) .wx-message-avatar-placeholder {
  margin-right: 8px;
}

:deep(.emoji-img) {
  width: 80px;
  height: 80px;
  vertical-align: middle;
  display: inline-block;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
}

.audio-player:hover {
  background: rgba(0, 0, 0, 0.08);
}

.audio-icon {
  font-size: 14px;
}

.audio-text {
  font-size: 13px;
  color: #576b95;
}
</style>
