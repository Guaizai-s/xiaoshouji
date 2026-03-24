<template>
  <div>
    <!-- 半页弹出层 -->
    <transition name="slide-up">
      <div v-if="showActionSheet" class="action-sheet-overlay" @click="showActionSheet = false">
        <div class="action-sheet" @click.stop>
          <div class="action-grid">
            <div class="action-item" @click="onImageClick">
              <div class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
              <span>相册</span>
            </div>
            <div class="action-item" @click="showActionSheet = false">
              <div class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.67C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>
                </svg>
              </div>
              <span>红包</span>
            </div>
            <div class="action-item" @click="showActionSheet = false">
              <div class="action-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.67C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>
                </svg>
              </div>
              <span>礼物</span>
            </div>
            <div class="action-item" @click="showActionSheet = false">
              <div class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <span>转账</span>
            </div>
            <div class="action-item" @click="showActionSheet = false">
              <div class="action-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <span>表情</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="wx-input-bar">
      <button class="wx-input-btn wx-input-plus" @click="showActionSheet = true" title="更多">
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
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['send', 'sendImage', 'generate']);

const inputText = ref('');
const fileInput = ref(null);
const selectedFile = ref(null);
const showActionSheet = ref(false);

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
</script>

<style scoped>
.wx-input-plus svg {
  width: 24px;
  height: 24px;
}

.wx-generate-btn {
  background: none;
  border: none;
  padding: 6px;
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

.action-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.action-sheet {
  width: 100%;
  background: #f7f7f7;
  border-radius: 16px 16px 0 0;
  padding: 20px 16px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
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
}

.slide-up-enter-from .action-sheet,
.slide-up-leave-to .action-sheet {
  transform: translateY(100%);
}
</style>
