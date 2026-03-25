<template>
  <div class="wx-page">
    <div class="nav-bar">
      <div class="nav-back" @click="$router.back()">
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="nav-title">用户设定</div>
      <div class="nav-action" @click="showEdit = true">+</div>
    </div>

    <div class="page-content">
      <div class="group-label">我的人设卡（{{ personas.length }}）</div>
      <div v-if="personas.length === 0" class="empty-hint">暂无人设卡，点击右上角 + 添加</div>
      <div v-else class="panel">
        <div v-for="p in personas" :key="p.id" class="list-item">
          <div class="item-content">
            <div class="item-name">{{ p.name }}</div>
            <div class="item-desc">{{ p.description }}</div>
          </div>
          <div class="item-actions">
            <span class="btn-edit" @click="editPersona(p)">编辑</span>
            <span class="btn-del" @click="deletePersona(p.id)">删除</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEdit" class="modal-overlay" @click="showEdit = false">
      <div class="modal-content" @click.stop>
        <div class="modal-title">{{ editingId ? '编辑' : '新增' }}人设卡</div>
        <div class="form-group">
          <label>名称</label>
          <input v-model="form.name" placeholder="例如：学生、职场人" maxlength="20" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="form.description" placeholder="填写用户信息，例如：&#10;· 我是一名大学生&#10;· 喜欢打篮球" rows="6"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEdit = false">取消</button>
          <button class="btn-confirm" @click="savePersona">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { personaService } from '../services/db';

const personas = ref([]);
const showEdit = ref(false);
const editingId = ref(null);
const form = ref({ name: '', description: '' });

const loadPersonas = async () => {
  personas.value = await personaService.getAll();
};

const editPersona = (p) => {
  editingId.value = p.id;
  form.value = { name: p.name, description: p.description };
  showEdit.value = true;
};

const savePersona = async () => {
  if (!form.value.name.trim()) return alert('请填写名称');
  if (editingId.value) {
    await personaService.update(editingId.value, form.value);
  } else {
    await personaService.create(form.value);
  }
  showEdit.value = false;
  editingId.value = null;
  form.value = { name: '', description: '' };
  await loadPersonas();
};

const deletePersona = async (id) => {
  if (confirm('确定删除此人设卡？')) {
    await personaService.delete(id);
    await loadPersonas();
  }
};

onMounted(loadPersonas);
</script>

<style scoped>
.wx-page { width: 100%; height: 100dvh; background: #f2f2f7; display: flex; flex-direction: column; }
.nav-bar { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; background: #ededed; border-bottom: 1px solid #e5e5e5; }
.nav-back { display: flex; align-items: center; cursor: pointer; min-width: 60px; }
.nav-title { font-size: 17px; font-weight: 600; }
.nav-action { font-size: 24px; cursor: pointer; min-width: 60px; text-align: right; }
.page-content { flex: 1; overflow-y: auto; padding-bottom: 20px; }
.group-label { padding: 14px 16px 6px; font-size: 12px; color: #8e8e93; }
.empty-hint { padding: 40px 16px; text-align: center; color: #c7c7cc; }
.panel { background: #fff; border-radius: 12px; margin: 0 16px; overflow: hidden; }
.list-item { display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; }
.list-item:last-child { border-bottom: none; }
.item-content { flex: 1; }
.item-name { font-size: 16px; font-weight: 500; margin-bottom: 4px; }
.item-desc { font-size: 13px; color: #666; line-height: 1.4; }
.item-actions { display: flex; gap: 12px; align-items: center; }
.btn-edit, .btn-del { font-size: 14px; cursor: pointer; }
.btn-edit { color: #007aff; }
.btn-del { color: #ff3b30; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 85%; background: #fff; border-radius: 12px; padding: 20px; }
.modal-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 14px; color: #666; margin-bottom: 6px; }
.form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 15px; font-family: inherit; }
.form-group textarea { resize: none; }
.modal-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-cancel, .btn-confirm { flex: 1; padding: 10px; border-radius: 6px; font-size: 16px; border: none; cursor: pointer; }
.btn-cancel { background: #f0f0f0; color: #666; }
.btn-confirm { background: #07c160; color: #fff; }
</style>
