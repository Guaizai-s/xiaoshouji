<template>
  <div class="wx-input-bar">
    <button class="wx-input-btn" @click="onVoiceClick" title="语音输入">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
    <button class="wx-input-btn" @click="onImageClick" title="发送图片">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
    <button
      class="wx-input-send"
      :disabled="!inputText.trim() && !selectedFile"
      @click="onSend"
    >
      发送
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { startVoiceRecognition, isSpeechRecognitionSupported } from '../services/speech';

const emit = defineEmits(['send', 'sendImage']);

const inputText = ref('');
const fileInput = ref(null);
const selectedFile = ref(null);

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

const onVoiceClick = async () => {
  if (!isSpeechRecognitionSupported()) {
    alert('当前浏览器不支持语音识别');
    return;
  }

  try {
    const text = await startVoiceRecognition();
    inputText.value = text;
  } catch (error) {
    alert(error.message);
  }
};

const onImageClick = () => {
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
.wx-input-btn svg {
  width: 24px;
  height: 24px;
}
</style>
