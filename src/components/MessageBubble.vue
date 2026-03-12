<template>
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
          {{ message.content }}
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
</script>
