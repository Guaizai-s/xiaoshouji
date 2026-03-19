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
          v-if="index === 0"
          class="wx-message-avatar"
          :src="avatar"
          alt="avatar"
        />
        <div v-else class="wx-message-avatar-placeholder"></div>
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
import { computed } from 'vue';

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
/* 整体包裹层，加入轻微的 Q 弹入场动画 */
.wx-message-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.wx-message-wrapper.self {
  align-items: flex-end;
}

/* 每一行消息（包含换行分割出的独立气泡） */
.wx-message {
  display: flex;
  align-items: flex-start; /* 顶部对齐，确保尖角和头像对齐 */
  margin-bottom: 8px; /* 换行气泡之间的间距 */
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
}

.wx-message.self {
  flex-direction: row-reverse;
}

/* 微信风格微圆角正方形头像 */
.wx-message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px; 
  object-fit: cover;
  flex-shrink: 0;
  background-color: #fff;
}

.wx-message:not(.self) .wx-message-avatar {
  margin-right: 12px;
}
.wx-message.self .wx-message-avatar {
  margin-left: 12px;
}

/* 没有头像时的占位符（用于换行后的气泡保持对齐） */
.wx-message-avatar-placeholder {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.wx-message:not(.self) .wx-message-avatar-placeholder {
  margin-right: 12px;
}
.wx-message.self .wx-message-avatar-placeholder {
  margin-left: 12px;
}

/* 内容区域 */
.wx-message-content {
  display: flex;
  flex-direction: column;
  max-width: 65%; /* 控制气泡最大宽度 */
  position: relative;
}

.wx-message.self .wx-message-content {
  align-items: flex-end;
}

/* --- 核心气泡样式 --- */
.wx-message-bubble {
  position: relative;
}

/* 仅对文本气泡应用底色和圆角 */
.wx-message-bubble.text {
  padding: 10px 14px;
  font-size: 16px;
  line-height: 1.4;
  word-break: break-word;
  border-radius: 8px;
  color: #111111;
}

/* AI 的文本气泡 (纯白) */
.wx-message:not(.self) .wx-message-bubble.text {
  background-color: #ffffff;
}

/* 用户的文本气泡 (微信绿) */
.wx-message.self .wx-message-bubble.text {
  background-color: #95ec69;
}

/* --- 气泡小尾巴 (伪元素三角形) --- */
/* 注意：使用了 :first-child，确保如果一段话被换行分割，只有第一个气泡有小尾巴 */
.wx-message:first-child:not(.self) .wx-message-bubble.text::before {
  content: '';
  position: absolute;
  top: 14px; /* 对齐头像上部 */
  left: -6px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #ffffff;
}

.wx-message:first-child.self .wx-message-bubble.text::before {
  content: '';
  position: absolute;
  top: 14px;
  right: -6px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #95ec69;
}

/* --- 图片和贴纸消息样式 --- */
.wx-message-bubble.image img,
.wx-message-bubble.sticker img {
  max-width: 100%;
  border-radius: 8px; /* 图片也加点圆角更柔和 */
  display: block;
}

/* --- 表情包解析样式 --- */
:deep(.emoji-img) {
  width: 24px; /* 行内表情大小，如果你原本的 80px 是大表情，可以改回去 */
  height: 24px;
  vertical-align: middle;
  display: inline-block;
  margin: 0 2px;
}

/* Q弹入场动画 */
@keyframes popIn {
  0% { opacity: 0; transform: scale(0.95) translateY(5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>