<template>
  <div class="wx-message-wrapper" :class="{ self: message.role === 'user' }">
    <div v-if="activeMenuId !== null" class="wx-menu-mask" @click.stop="closeMenu" @touchstart.prevent="closeMenu"></div>

    <template v-if="isWalletMessage">
      <div class="wx-message wallet-message" :class="{ self: message.role === 'user' }">
        <img class="wx-message-avatar" :src="avatar" alt="avatar" />
        <div class="wx-message-content wallet-content" style="position: relative;">
          <div v-if="activeMenuId === 'wallet'" class="wx-context-menu" :class="{ 'is-self': message.role === 'user' }">
            <div class="menu-item" @click.stop="handleDelete">删除</div>
          </div>
          <div
            class="wallet-card"
            :class="[message.type, walletData.status, { clickable: canOpenWalletCard }]"
            @click="onWalletCardClick"
            @mousedown="onPressStart('wallet')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('wallet')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'wallet')"
          >
            <div class="wallet-card-main">
              <div class="wallet-card-icon">
                <span v-if="message.type === 'redpacket'" class="redpacket-icon-mark">&yen;</span>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12.5l4.2 4.2L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="wallet-card-text">
                <div class="wallet-card-title">{{ walletTitle }}</div>
                <div class="wallet-card-note">{{ walletNote }}</div>
              </div>
            </div>
            <div class="wallet-card-footer">
              <span>{{ walletFooter }}</span>
              <div v-if="showWalletActions" class="wallet-card-actions">
                <button v-if="message.type === 'transfer'" @click.stop="emit('refund-transfer', message.id)">退回</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="message.type === 'text' && messageParts.length > 1">
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
            class="audio-player" :class="{ 'is-playing': isPlaying }" :style="{ width: audioBubbleWidth }" @click="toggleAudio"
            @mousedown="onPressStart('audio-multi')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('audio-multi')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'audio-multi')"
          >
            <span class="audio-icon">
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
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
            class="audio-player" :class="{ 'is-playing': isPlaying }" :style="{ width: audioBubbleWidth }" @click="toggleAudio"
            @mousedown="onPressStart('audio-single')" @mouseup="onPressEnd" @mouseleave="onPressEnd"
            @touchstart.passive="onPressStart('audio-single')" @touchend="onPressEnd" @touchcancel="onPressEnd"
            @contextmenu.prevent="onContextMenu($event, 'audio-single')"
          >
            <span class="audio-icon">
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
              <span class="audio-wave-bar"></span>
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
import { assetService, formatCents, walletService } from '../services/db';

const props = defineProps({
  message: { type: Object, required: true },
  userAvatar: { type: String, default: '' },
  roleAvatar: { type: String, default: '' },
  linkedStickers: { type: Array, default: () => [] }
});

const emit = defineEmits(['delete', 'claim-wallet', 'refund-transfer']);

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
const walletData = ref({});

const IMAGE_KEY_RE = /^\[IMAGE:(.+)\]$/;

const resolveImage = async () => {
  if (props.message.type !== 'image') return;
  const content = props.message.content || '';
  const match = content.match(IMAGE_KEY_RE);
  imageUrl.value = match ? (await assetService.get(match[1]) || '') : content;
};

onMounted(resolveImage);
watch(() => props.message.content, resolveImage);

const resolveWallet = async () => {
  if (!isWalletMessage.value) return;
  const cached = walletService.parseMessageContent(props.message.content);
  const tx = await walletService.getTransactionFromMessage(props.message);
  walletData.value = tx ? { ...cached, ...tx } : cached;
};

onMounted(resolveWallet);
watch(() => props.message.content, resolveWallet);

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

const isWalletMessage = computed(() => ['redpacket', 'transfer'].includes(props.message.type));

const formattedWalletAmount = computed(() => formatCents(walletData.value.amountCents || 0));

const showWalletActions = computed(() => {
  return props.message.role === 'assistant' && walletData.value.status === 'pending' && props.message.type === 'transfer';
});

const canOpenWalletCard = computed(() => {
  return props.message.role === 'assistant' && walletData.value.status === 'pending';
});

const onWalletCardClick = () => {
  if (!canOpenWalletCard.value || activeMenuId.value !== null) return;
  emit('claim-wallet', props.message.id);
};

const walletTitle = computed(() => {
  if (props.message.type === 'redpacket') {
    if (walletData.value.status === 'claimed') return `¥${formattedWalletAmount.value}`;
    return walletData.value.note || '恭喜发财，大吉大利';
  }
  return `¥${formattedWalletAmount.value}`;
});

const walletNote = computed(() => {
  const status = walletData.value.status;
  if (props.message.type === 'redpacket') {
    if (status === 'claimed') return '已领取';
    return props.message.role === 'assistant' ? '点击领取红包' : '红包已发送';
  }
  if (status === 'pending') return props.message.role === 'assistant' ? '待收款' : '等待对方收款';
  if (status === 'claimed') return props.message.role === 'assistant' ? '已被接收' : '已收款';
  if (status === 'refunded') return '已退回';
  return walletData.value.note || '转账';
});

const walletFooter = computed(() => {
  return props.message.type === 'redpacket' ? '微信红包' : '转账';
});

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
  background: var(--wx-bubble-other);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 60px;
  -webkit-tap-highlight-color: transparent;
}
.audio-player:active { background: rgba(0, 0, 0, 0.08); }

@media (hover: hover) and (pointer: fine) {
  .audio-player:hover { background: rgba(0, 0, 0, 0.08); }
}

.audio-icon {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  color: var(--wx-text-primary);
  font-size: 14px;
}

.audio-wave-bar {
  width: 3px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  transition: height 0.18s ease;
}

.audio-wave-bar:nth-child(2) { height: 12px; }
.audio-wave-bar:nth-child(3) { height: 8px; }
.audio-wave-bar:nth-child(4) { height: 14px; }
.audio-wave-bar:nth-child(5) { height: 9px; }

.audio-player.is-playing .audio-wave-bar:nth-child(1) { animation: audioWave 1s infinite ease-in-out; }
.audio-player.is-playing .audio-wave-bar:nth-child(2) { animation: audioWave 1s infinite ease-in-out 0.2s; }
.audio-player.is-playing .audio-wave-bar:nth-child(3) { animation: audioWave 1s infinite ease-in-out 0.4s; }
.audio-player.is-playing .audio-wave-bar:nth-child(4) { animation: audioWave 1s infinite ease-in-out 0.1s; }
.audio-player.is-playing .audio-wave-bar:nth-child(5) { animation: audioWave 1s infinite ease-in-out 0.25s; }

@keyframes audioWave {
  0%, 100% { height: 6px; }
  50% { height: 16px; }
}

.audio-duration { font-size: 16px; color: var(--wx-text-primary); font-weight: 500; }

.audio-transcript {
  margin-top: 8px;
  padding: 12px 16px;
  background: var(--wx-bubble-other);
  border-radius: 8px;
  font-size: 15px;
  color: var(--wx-text-primary);
  line-height: 1.5;
  word-break: break-word;
}

/* 微信风悬浮菜单 */
.wallet-content {
  max-width: min(248px, calc(100vw - 104px));
  width: min(248px, calc(100vw - 104px));
}

.wallet-card {
  position: relative;
  overflow: visible;
  border-radius: 6px;
  color: #fff;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
  -webkit-tap-highlight-color: transparent;
}

.wallet-card.clickable {
  cursor: pointer;
}

.wallet-card::before {
  content: '';
  position: absolute;
  top: 18px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

.wallet-message:not(.self) .wallet-card::before {
  left: -8px;
  border-right: 9px solid var(--wallet-card-bg);
}

.wallet-message.self .wallet-card::before {
  right: -8px;
  border-left: 9px solid var(--wallet-card-bg);
}

.wallet-card.redpacket {
  --wallet-card-bg: #f99a33;
  background: var(--wallet-card-bg);
}

.wallet-card.transfer {
  --wallet-card-bg: #fac995;
  background: var(--wallet-card-bg);
}

.wallet-card.claimed,
.wallet-card.refunded {
  opacity: 0.78;
}

.wallet-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 13px 14px 12px;
  border-radius: 6px 6px 0 0;
}

.wallet-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4px solid rgba(255, 255, 255, 0.9);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  box-sizing: border-box;
}

.wallet-card.redpacket .wallet-card-icon {
  width: 36px;
  height: 48px;
  border: none;
  border-radius: 5px;
  background: linear-gradient(180deg, #ff5656 0%, #e94747 100%);
  box-shadow: inset 0 -18px rgba(190, 35, 35, 0.12);
}

.redpacket-icon-mark {
  width: 17px;
  height: 17px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffd45c;
  color: #c3562c;
  font-size: 13px;
  line-height: 1;
}

.wallet-card-icon svg {
  width: 29px;
  height: 29px;
}

.wallet-card-text {
  flex: 1;
  min-width: 0;
}

.wallet-card-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
  color: #fff;
}

.wallet-card-note {
  margin-top: 4px;
  font-size: 16px;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-card-footer {
  min-height: 28px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fff;
  color: #b08a62;
  font-size: 12px;
  border-radius: 0 0 6px 6px;
}

.wallet-card.redpacket .wallet-card-footer {
  color: #e5c097;
}

.wallet-card-actions {
  display: flex;
  gap: 10px;
}

.wallet-card-actions button {
  border: none;
  background: none;
  padding: 0;
  color: #576b95;
  font-size: 12px;
}

[data-theme="dark"] .wallet-card-footer {
  background: #252525;
  color: #c8c8c8;
}

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
