<template>
  <div class="wx-page">
    <nav-bar title="编辑角色" :show-back="true" action="删除" @action="deleteRole" />

    <div class="wx-content" v-if="role">
      <div class="wx-form">
        <!-- 头像上传 -->
        <div class="wx-form-group">
          <label class="wx-form-label">角色头像</label>
          <div class="avatar-upload">
            <div class="avatar-preview" @click="selectAvatar">
              <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" />
              <div v-else class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
          <label class="wx-form-label">角色名称 *</label>
          <input
            v-model="formData.name"
            class="wx-form-input"
            type="text"
            placeholder="例如: AI助手、编程顾问"
          />
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">API 格式 *</label>
          <select v-model="formData.apiFormat" class="wx-form-select">
            <option value="anthropic">Anthropic (官方)</option>
            <option value="openai">OpenAI 兼容</option>
          </select>
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">API Key *</label>
          <input
            v-model="formData.apiKey"
            class="wx-form-input"
            type="password"
            placeholder="请输入 API Key"
          />
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">API 端点 (可选)</label>
          <input
            v-model="formData.baseUrl"
            class="wx-form-input"
            type="text"
            :placeholder="apiPlaceholder"
          />
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">模型名称 (可选)</label>
          <input
            v-model="formData.model"
            class="wx-form-input"
            type="text"
            :placeholder="modelPlaceholder"
          />
        </div>

        <div class="wx-form-group">
          <label class="wx-form-label">系统提示词 (可选)</label>
          <textarea
            v-model="formData.systemPrompt"
            class="wx-form-textarea"
            placeholder="为角色设定性格、专业领域等，例如: 你是一位友好的AI助手，擅长解决编程问题..."
          ></textarea>
        </div>

        <button class="wx-btn" :disabled="!isValid" @click="save">
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import { roleService } from '../services/db';

const router = useRouter();
const route = useRoute();
const roleId = parseInt(route.params.id);

const avatarInput = ref(null);
const avatarPreview = ref('');
const role = ref(null);

const formData = ref({
  name: '',
  apiFormat: 'anthropic',
  apiKey: '',
  baseUrl: '',
  model: '',
  systemPrompt: ''
});

const apiPlaceholder = computed(() => {
  return formData.value.apiFormat === 'anthropic'
    ? 'https://api.anthropic.com/v1/messages'
    : 'https://api.openai.com/v1/chat/completions';
});

const modelPlaceholder = computed(() => {
  return formData.value.apiFormat === 'anthropic'
    ? 'claude-3-5-sonnet-20241022'
    : 'gpt-3.5-turbo';
});

const isValid = computed(() => {
  return formData.value.name.trim() && formData.value.apiKey.trim();
});

onMounted(async () => {
  role.value = await roleService.getById(roleId);
  if (role.value) {
    formData.value = {
      name: role.value.name,
      apiFormat: role.value.apiFormat,
      apiKey: role.value.apiKey,
      baseUrl: role.value.baseUrl || '',
      model: role.value.model || '',
      systemPrompt: role.value.systemPrompt || ''
    };
    avatarPreview.value = role.value.avatar || '';
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
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const save = async () => {
  if (!isValid.value) {
    alert('请填写必填项');
    return;
  }

  try {
    await roleService.update(roleId, {
      name: formData.value.name.trim(),
      apiFormat: formData.value.apiFormat,
      apiKey: formData.value.apiKey.trim(),
      baseUrl: formData.value.baseUrl.trim() || null,
      model: formData.value.model.trim() || null,
      avatar: avatarPreview.value || null,
      systemPrompt: formData.value.systemPrompt.trim() || null
    });

    alert('修改成功！');
    router.back();
  } catch (error) {
    alert('修改失败: ' + error.message);
  }
};

const deleteRole = async () => {
  if (confirm(`确定删除角色"${role.value.name}"吗？删除后相关聊天记录也会被删除。`)) {
    try {
      await roleService.delete(roleId);
      alert('删除成功');
      router.push('/contacts');
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  }
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
