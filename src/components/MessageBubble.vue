<template>
  <div class="wx-message-wrapper" :class="{ self: message.role === 'user' }">
    <div v-if="activeMenuId !== null" class="wx-menu-mask" @click.stop="closeMenu" @touchstart.prevent="closeMenu"></div>

    <template v-if="message.type === 'text' && messageParts.length > 1">
      <div v-for="(part, index) in messageParts" :key="index" class="wx-message" :class="{ self: message.role === 'user' }">
        <img class="wx-message-avatar" :src="avatar" alt="avatar" />
        <div class="wx-message-content" style="position: relative;">
          <div v-if="activeMenuId === 'part-' + index" class="wx-context-menu" :class="{ 'is-self': message.role === 'user' }">
            <div class="menu-item" @click.stop="handleDelete">删除</div>
          </div>
          <div
            class="wx-message-bubble text"
            v-html="parseEmoji(part)"
            @mousedown="onPressStart('part-' + index)" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('part-' + index)" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'part-' + index)"
          ></div>
        </div>
      </div>

      <div v-if="message.audioUrl" class="wx-message" :class="{ self: message.role === 'user' }">
        <img class="wx-message-avatar" :src="avatar" alt="avatar" />
        <div class="wx-message-content" style="position: relative;">
          <div v-if="activeMenuId === 'audio-multi'" class="wx-context-menu" :class="{ 'is-self': message.role === 'user' }">
            <div class="menu-item" @click.stop="handleDelete">删除</div>
          </div>
          <div
            class="audio-player" :style="{ width: audioBubbleWidth }" @click="toggleAudio"
            @mousedown="onPressStart('audio-multi')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('audio-multi')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'audio-multi')"
          >
            <span class="audio-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 8h2v4H3V8zm4-2h2v8H7V6zm4-2h2v12h-2V4z" /></svg>
            </span>
            <span class="audio-duration">{{ audioDuration }}"</span>
          </div>
          <div v-if="showTranscript" class="audio-transcript">{{ message.content }}</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="message.content && !message.audioUrl" class="wx-message" :class="{ self: message.role === 'user' }">
        <img class="wx-message-avatar" :src="avatar" alt="avatar" />
        <div class="wx-message-content" style="position: relative;">
          <div v-if="activeMenuId === 'single'" class="wx-context-menu" :class="{ 'is-self': message.role === 'user' }">
            <div class="menu-item" @click.stop="handleDelete">删除</div>
          </div>
          <div
            class="wx-message-bubble" :class="message.type"
            @mousedown="onPressStart('single')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('single')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'single')"
          >
            <template v-if="message.type === 'text'"><span v-html="parseEmoji(message.content)"></span></template>
            <template v-else-if="message.type === 'image'"><img :src="imageUrl" alt="image" /></template>
            <template v-else-if="message.type === 'sticker'"><img :src="message.content" alt="sticker" /></template>
          </div>
        </div>
      </div>

      <div v-if="message.audioUrl" class="wx-message" :class="{ self: message.role === 'user' }">
        <img class="wx-message-avatar" :src="avatar" alt="avatar" />
        <div class="wx-message-content" style="position: relative;">
          <div v-if="activeMenuId === 'audio-single'" class="wx-context-menu" :class="{ 'is-self': message.role === 'user' }">
            <div class="menu-item" @click.stop="handleDelete">删除</div>
          </div>
          <div
            class="audio-player" :style="{ width: audioBubbleWidth }" @click="toggleAudio"
            @mousedown="onPressStart('audio-single')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('audio-single')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'audio-single')"
          >
            <span class="audio-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 8h2v4H3V8zm4-2h2v8H7V6zm4-2h2v12h-2V4z" /></svg>
            </span>
            <span class="audio-duration">{{ audioDuration }}"</span>
          </div>
          <div v-if="showTranscript" class="audio-transcript">{{ message.content }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { assetService } from '../services/db';

const props = defineProps({
  message: { type: Object, required: true },
  userAvatar: { type: String, default: '' },
  roleAvatar: { type: String, default: '' },
  linkedStickers: { type: Array, default: () => [] }
});

const emit = defineEmits(['delete']);

const activeMenuId = ref(null);
let pressTimer = null;

const onPressStart = (id) => {
  pressTimer = setTimeout(() => { activeMenuId.value = id; }, 500);
};
const onPressEnd = () => { clearTimeout(pressTimer); };
const closeMenu = () => { activeMenuId.value = null; };
const onContextMenu = (e, id) => { activeMenuId.value = id; };
const handleDelete = () => { emit('delete', props.message.id); closeMenu(); };

const isPlaying = ref(false);
const audioElement = ref(null);
const showTranscript = ref(false);
const imageUrl = ref('');

const IMAGE_KEY_RE = /^\[IMAGE:(.+)\]$/;

const resolveImage = async () => {
  if (props.message.type !== 'image') return;
  const content = props.message.content || '';
  const match = content.match(IMAGE_KEY_RE);
  imageUrl.value = match ? (await assetService.get(match[1]) || '') : content;
};

onMounted(resolveImage);
watch(() => props.message.content, resolveImage);

const toggleAudio = () => {
  if (!props.message.audioUrl) return;
  if (activeMenuId.value !== null) return;

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

const avatar = computed(() => props.message.role === 'user' ? props.userAvatar : props.roleAvatar);

const audioDuration = computed(() => {
  if (!props.message.audioUrl) return 0;
  const text = props.message.content || '';
  const chineseChars = (text.match(/[一-龥]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.min(Math.ceil(chineseChars / 3.5 + englishWords / 2.5), 60));
});

const audioBubbleWidth = computed(() => `${Math.min(60 + audioDuration.value * 3, 200)}px`);

const messageParts = computed(() => {
  if (props.message.type !== 'text') return [props.message.content];
  return props.message.content.split('\n').filter(part => part.trim());
});

const parseEmoji = (text) => {
  if (!text) return '';
  return text.replace(/\[表情[：:]\s*([^\]]+)\]/g, (match, emojiName) => {
    const name = emojiName.trim();
    const sticker = props.linkedStickers.find(s => s.name === name);
    return sticker?.imageUrl ? `<img class="emoji-img" src="${sticker.imageUrl}" alt="${name}" />` : `[${name}]`;
  });
};
</script>

<style scoped>
.wx-message-wrapper {
  display: flex;
  flex-direction: column;
  animation: popIn 0.2s ease-out both;
}
.wx-message-wrapper.self { align-items: flex-end; }

@keyframes popIn {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
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
.audio-player:active, .audio-player:hover { background: rgba(0, 0, 0, 0.08); }

.audio-icon { display: flex; align-items: center; color: #000; font-size: 14px; }
.audio-duration { font-size: 16px; color: #000; font-weight: 500; }

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

/* 微信风悬浮菜单 */
.wx-menu-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 998;
}

.wx-context-menu {
  position: absolute;
  top: -46px;
  background-color: #4c4c4c;
  color: #fff;
  padding: 0 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  animation: fadeIn 0.15s ease-out;
}

.wx-context-menu::after {
  content: '';
  position: absolute;
  bottom: -5px;
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #4c4c4c;
}

.wx-context-menu:not(.is-self) { left: 0; }
.wx-context-menu:not(.is-self)::after { left: 16px; }
.wx-context-menu.is-self { right: 0; }
.wx-context-menu.is-self::after { right: 16px; }

.menu-item { cursor: pointer; padding: 0 4px; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
