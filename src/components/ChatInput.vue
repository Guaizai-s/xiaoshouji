<template>
  <div class="input-container">
    <div class="wx-input-bar">
      <button class="wx-input-btn wx-input-plus" @click="onPlusClick" title="更多">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onFileChange"
      />
      <input
        v-model="inputText"
        class="wx-input-field"
        type="text"
        placeholder="请输入消息..."
        @keyup.enter="onSend"
      />
      <button class="wx-input-btn wx-generate-btn" @click="onGenerate" title="生成回复">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 3l3.057-3L20 12 8.057 24 5 21l9-9-9-9z"/>
        </svg>
      </button>
     <button
  class="wx-input-send"
  :disabled="!inputText.trim()"
  @mousedown.prevent="onSend"
  @touchend.prevent="onSend"
>
  发送
</button>
    </div>

    <!-- 功能面板 -->
    <transition name="slide-up">
      <div v-if="showActionSheet" class="action-panel" @click.stop>
      <div class="action-grid">
        <div class="action-item" @click="onImageClick">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <span>相册</span>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <span>拍摄</span>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.05a16 16 0 006.86 6.86l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <span>语音通话</span>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span>位置</span>
        </div>
        <div class="action-item" @click="openWalletSheet('redpacket')">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <path d="M3 9h18"/>
              <circle cx="12" cy="13" r="2" fill="currentColor"/>
            </svg>
          </div>
          <span>红包</span>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="4" y="8" width="16" height="12" rx="1"/>
              <path d="M4 8l8-5 8 5"/>
              <path d="M12 3v5"/>
            </svg>
          </div>
          <span>礼物</span>
        </div>
        <div class="action-item" @click="openWalletSheet('transfer')">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
              <path d="M16 8l4-4M20 8l-4-4"/>
            </svg>
          </div>
          <span>转账</span>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <span>表情</span>
        </div>
      </div>
    </div>
  </transition>

    <!-- 图片发送选项弹窗 -->
    <teleport to="body">
      <div v-if="pendingFile" class="image-options-overlay" @click.self="cancelImageSend">
        <div class="image-options-sheet">
          <img :src="pendingPreview" class="image-options-preview" />
          <div class="image-options-actions">
            <button class="image-option-btn" @click="confirmImageSend(false)">压缩</button>
            <button class="image-option-btn primary" @click="confirmImageSend(true)">原图</button>
          </div>
          <button class="image-option-cancel" @click="cancelImageSend">取消</button>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="walletSheetMode" class="wallet-sheet-overlay" @click.self="closeWalletSheet">
        <div class="wallet-sheet" @click.stop>
          <div class="wallet-sheet-handle"></div>
          <div class="wallet-sheet-header">
            <button class="wallet-sheet-cancel" @click="closeWalletSheet">取消</button>
            <div class="wallet-sheet-title">{{ walletSheetMode === 'redpacket' ? '发红包' : '转账' }}</div>
            <div class="wallet-sheet-placeholder"></div>
          </div>

          <div class="wallet-amount-card">
            <label class="wallet-label">金额</label>
            <div class="wallet-amount-row">
              <span class="wallet-currency">¥</span>
              <input
                v-model="walletAmount"
                class="wallet-amount-input"
                inputmode="decimal"
                placeholder="0.00"
                @input="walletError = ''"
              />
            </div>
          </div>

          <div class="wallet-note-card">
            <input
              v-model="walletNote"
              class="wallet-note-input"
              :placeholder="walletSheetMode === 'redpacket' ? '恭喜发财，大吉大利' : '添加转账说明'"
              maxlength="32"
            />
          </div>

          <div class="wallet-balance-row">
            <span>零钱余额 ¥{{ formattedWalletBalance }}</span>
          </div>

          <div v-if="walletError" class="wallet-error">{{ walletError }}</div>
          <button class="wallet-confirm-btn" @click="confirmWalletSend">
            {{ walletSheetMode === 'redpacket' ? '塞钱进红包' : '转账' }}
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatCents } from '../services/db';

const props = defineProps({
  walletBalanceCents: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['send', 'sendImage', 'generate', 'sendWallet']);

const inputText = ref('');
const fileInput = ref(null);
const showActionSheet = ref(false);
const pendingFile = ref(null);
const pendingPreview = ref('');
const walletSheetMode = ref('');
const walletAmount = ref('');
const walletNote = ref('');
const walletError = ref('');

const formattedWalletBalance = computed(() => formatCents(props.walletBalanceCents));

const onSend = () => {
  if (inputText.value.trim()) {
    emit('send', inputText.value.trim());
    inputText.value = '';
  }
};

const onGenerate = () => {
  emit('generate');
};

const onImageClick = () => {
  showActionSheet.value = false;
  fileInput.value?.click();
};

const openWalletSheet = (mode) => {
  walletSheetMode.value = mode;
  walletAmount.value = '';
  walletNote.value = '';
  walletError.value = '';
  showActionSheet.value = false;
  document.activeElement?.blur();
};

const closeWalletSheet = () => {
  walletSheetMode.value = '';
  walletError.value = '';
};

const confirmWalletSend = () => {
  walletError.value = '';
  if (!walletAmount.value.trim()) {
    walletError.value = '请输入金额';
    return;
  }
  emit('sendWallet', {
    type: walletSheetMode.value,
    amount: walletAmount.value,
    note: walletNote.value.trim()
  });
};

const onFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  pendingFile.value = file;
  pendingPreview.value = URL.createObjectURL(file);
  event.target.value = '';
};

const confirmImageSend = (useOriginal) => {
  emit('sendImage', pendingFile.value, useOriginal);
  URL.revokeObjectURL(pendingPreview.value);
  pendingFile.value = null;
  pendingPreview.value = '';
};

const cancelImageSend = () => {
  URL.revokeObjectURL(pendingPreview.value);
  pendingFile.value = null;
  pendingPreview.value = '';
};

const closeActionSheet = () => {
  showActionSheet.value = false;
  closeWalletSheet();
};

const onPlusClick = () => {
  showActionSheet.value = !showActionSheet.value;
  if (showActionSheet.value) {
    document.activeElement?.blur();
  }
};

defineExpose({ closeActionSheet });
</script>

<style scoped>
.input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(247, 247, 247, 0.96);
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.wx-input-plus svg {
  width: 24px;
  height: 24px;
}

.wx-generate-btn {
  background: transparent;
  border: none;
  padding: 7px;
  margin-left: 2px;
  cursor: pointer;
  color: #3f536f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wx-generate-btn svg {
  width: 22px;
  height: 22px;
}

.wx-generate-btn:active {
  opacity: 0.6;
}

.action-panel {
  background: #F2F2F2;
  border-top: 1px solid var(--wx-border);
  padding: 18px 18px 20px;
  min-height: 226px;
  height: auto;
  box-sizing: border-box;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.action-icon {
  width: 58px;
  height: 58px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wx-white);
  color: #2E2E2E;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.16s ease, background 0.16s ease;
}

.action-item:active .action-icon {
  transform: scale(0.96);
  background: #F8F8F8;
}

.action-icon svg {
  width: 28px;
  height: 28px;
}

.action-item span {
  font-size: 12px;
  color: #727272;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 图片发送选项弹窗 */
.image-options-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.image-options-sheet {
  width: 100%;
  background: #F3F3F3;
  border-radius: 20px 20px 0 0;
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.image-options-preview {
  width: 100%;
  max-height: 40vh;
  object-fit: contain;
  border-radius: 8px;
  background: #000;
}

.image-options-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.image-option-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  background: var(--wx-white);
  color: var(--wx-text-primary);
}

.image-option-btn.primary {
  background: #07c160;
  color: #fff;
}

.image-option-btn:active {
  opacity: 0.7;
}

.image-option-cancel {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  background: var(--wx-white);
  color: var(--wx-text-primary);
  margin-bottom: env(safe-area-inset-bottom, 0);
}

.image-option-cancel:active {
  opacity: 0.7;
}

.wallet-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.38);
}

.wallet-sheet {
  width: 100%;
  padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
  background: #F4F4F4;
  border-radius: 20px 20px 0 0;
  box-sizing: border-box;
}

.wallet-sheet-handle {
  width: 36px;
  height: 4px;
  margin: 0 auto 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
}

.wallet-sheet-header {
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  height: 44px;
}

.wallet-sheet-cancel {
  border: none;
  background: transparent;
  padding: 0;
  color: #576b95;
  font-size: 15px;
  text-align: left;
}

.wallet-sheet-title {
  text-align: center;
  color: var(--wx-text-primary);
  font-size: 17px;
  font-weight: 600;
}

.wallet-amount-card,
.wallet-note-card {
  background: var(--wx-white);
  border-radius: 14px;
  padding: 15px 16px;
  margin-top: 12px;
  box-shadow: var(--wx-shadow-soft);
}

.wallet-label {
  display: block;
  color: var(--wx-text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.wallet-amount-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.wallet-currency {
  color: var(--wx-text-primary);
  font-size: 24px;
  font-weight: 600;
}

.wallet-amount-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--wx-text-primary);
  font-size: 34px;
  line-height: 1.2;
  font-weight: 600;
}

.wallet-note-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--wx-text-primary);
  font-size: 15px;
}

.wallet-balance-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 2px 0;
  color: var(--wx-text-secondary);
  font-size: 13px;
}

.wallet-error {
  margin-top: 12px;
  color: #fa5151;
  font-size: 13px;
  text-align: center;
}

.wallet-confirm-btn {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: none;
  border-radius: 14px;
  background: var(--wx-green);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

[data-theme="dark"] .wallet-sheet-handle {
  background: rgba(255, 255, 255, 0.18);
}
</style>
