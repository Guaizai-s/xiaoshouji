<template>
  <div class="wx-page">
    <nav-bar title="个人信息" :show-back="true" />

    <div class="wx-content">
      <div class="wx-form">
        <!-- 头像上传 -->
        <div class="wx-form-group">
          <label class="wx-form-label">头像</label>
          <div class="avatar-upload">
            <div class="avatar-preview" @click="selectAvatar">
              <img v-if="formData.avatar" :src="formData.avatar" alt="avatar" />
              <div v-else class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>点击上传</span>
              </div>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
          </div>
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">昵称</label>
          <input
            v-model="formData.name"
            class="wx-form-input"
            type="text"
            placeholder="请输入昵称"
          />
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">微信号</label>
          <input
            v-model="formData.wxId"
            class="wx-form-input"
            type="text"
            placeholder="请输入微信号"
          />
        </div>

        <button class="wx-btn" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';

const router = useRouter();
const avatarInput = ref(null);

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%2307C160" width="96" height="96" rx="8"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="white"%3E我%3C/text%3E%3C/svg%3E';

const formData = ref({
  name: '小手机用户',
  wxId: 'xiaoshouji_001',
  avatar: defaultAvatar
});

onMounted(() => {
  // 从 localStorage 读取保存的用户信息
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      formData.value = {
        name: data.name || '小手机用户',
        wxId: data.wxId || 'xiaoshouji_001',
        avatar: data.avatar || defaultAvatar
      };
    } catch (error) {
      console.error('读取用户信息失败', error);
    }
  }
});

const selectAvatar = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const save = () => {
  // 保存到 localStorage
  localStorage.setItem('userProfile', JSON.stringify(formData.value));
  alert('保存成功');
  router.back();
};
</script>

<style scoped>
.avatar-upload {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: #f5f5f5;
  border: 2px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.avatar-placeholder svg {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
}

.avatar-placeholder span {
  font-size: 12px;
}
</style>
