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
        :disabled="!inputText.trim() && !selectedFile"
        @click="onSend"
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
        <div class="action-item">
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
        <div class="action-item">
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
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['send', 'sendImage', 'generate']);

const inputText = ref('');
const fileInput = ref(null);
const selectedFile = ref(null);
const showActionSheet = ref(false);
const inputField = ref(null);

const onSend = () => {
  if (selectedFile.value) {
    emit('sendImage', selectedFile.value);
    selectedFile.value = null;
    inputText.value = '';
  } else if (inputText.value.trim()) {
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

const onFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    selectedFile.value = file;
    inputText.value = `[图片: ${file.name}]`;
  }
};

const closeActionSheet = () => {
  showActionSheet.value = false;
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
  background: #fff;
}

.wx-input-plus svg {
  width: 24px;
  height: 24px;
}

.wx-generate-btn {
  background: none;
  border: none;
  padding: 6px;
  margin-left: 8px;
  cursor: pointer;
  color: #576b95;
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
  background: #f7f7f7;
  border-top: 1px solid #e5e5e5;
  padding: 16px;
  height: 220px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #1a1a1a;
}

.action-icon svg {
  width: 28px;
  height: 28px;
}

.action-item span {
  font-size: 12px;
  color: #666;
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
</style>
