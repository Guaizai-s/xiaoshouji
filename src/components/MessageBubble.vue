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

      <!-- 音频播放器单独气泡 -->
      <div v-if="message.audioUrl" class="wx-message" :class="{ self: message.role === 'user' }">
        <img
          class="wx-message-avatar"
          :src="avatar"
          alt="avatar"
        />
        <div class="wx-message-content">
          <div class="audio-player" :style="{ width: audioBubbleWidth }" @click="toggleAudio">
            <span class="audio-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 8h2v4H3V8zm4-2h2v8H7V6zm4-2h2v12h-2V4z" />
              </svg>
            </span>
            <span class="audio-duration">{{ audioDuration }}"</span>
          </div>
          <div v-if="showTranscript" class="audio-transcript">
            {{ message.content }}
          </div>
        </div>
      </div>
    </template>
    <!-- 单条消息 -->
    <template v-else>
      <!-- 文本气泡 -->
      <div v-if="message.content" class="wx-message" :class="{ self: message.role === 'user' }">
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

      <!-- 音频播放器单独气泡 -->
      <div v-if="message.audioUrl" class="wx-message" :class="{ self: message.role === 'user' }">
        <img
          class="wx-message-avatar"
          :src="avatar"
          alt="avatar"
        />
        <div class="wx-message-content">
          <div class="audio-player" :style="{ width: audioBubbleWidth }" @click="toggleAudio">
            <span class="audio-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 8h2v4H3V8zm4-2h2v8H7V6zm4-2h2v12h-2V4z" />
              </svg>
            </span>
            <span class="audio-duration">{{ audioDuration }}"</span>
          </div>
          <div v-if="showTranscript" class="audio-transcript">
            {{ message.content }}
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
  },
  linkedStickers: {
    type: Array,
    default: () => []
  }
});

const isPlaying = ref(false);
const audioElement = ref(null);
const showTranscript = ref(false);

const toggleAudio = () => {
  if (!props.message.audioUrl) return;

  // 切换文字显示
  showTranscript.value = !showTranscript.value;

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

// 估算音频时长（基于文本长度）
const audioDuration = computed(() => {
  if (!props.message.audioUrl) return 0;
  // 中文约3.5字/秒，英文约2.5词/秒
  const text = props.message.content || '';
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const duration = Math.ceil(chineseChars / 3.5 + englishWords / 2.5);
  return Math.max(1, Math.min(duration, 60)); // 最小1秒，最大60秒
});

// 气泡宽度（根据时长动态变化）
const audioBubbleWidth = computed(() => {
  const duration = audioDuration.value;
  const width = 60 + duration * 3; // 基础60px + 每秒3px
  return `${Math.min(width, 200)}px`; // 最大200px
});

// 分割消息（按换行符）
const messageParts = computed(() => {
  if (props.message.type !== 'text') return [props.message.content];
  // 按换行符分割，过滤空行
  return props.message.content.split('\n').filter(part => part.trim());
});

// 解析表情标签 [表情:xxx] -> 使用用户上传的表情包
const parseEmoji = (text) => {
  if (!text) return '';
  // 匹配 [表情:xxx] 或 [表情：xxx] 格式
  return text.replace(/\[表情[：:]\s*([^\]]+)\]/g, (match, emojiName) => {
    const name = emojiName.trim();
    // 从关联的表情包中查找
    const sticker = props.linkedStickers.find(s => s.name === name);
    if (sticker && sticker.imageUrl) {
      return `<img class="emoji-img" src="${sticker.imageUrl}" alt="${name}" />`;
    }
    // 如果没找到，显示文本
    return `[${name}]`;
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
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 60px;
}

.audio-player:active {
  background: #f0f0f0;
}

.audio-icon {
  display: flex;
  align-items: center;
  color: #000;
}

.audio-duration {
  font-size: 16px;
  color: #000;
  font-weight: 500;
}

.audio-transcript {
  margin-top: 8px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  font-size: 15px;
  color: #000;
  line-height: 1.5;
  word-break: break-word;
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
