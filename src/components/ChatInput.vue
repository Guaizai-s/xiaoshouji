<template>
  <div class="wx-input-bar">
    <button class="wx-input-btn wx-input-plus" @click="onImageClick" title="更多">
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
.wx-input-plus svg {
  width: 24px;
  height: 24px;
}
</style>
