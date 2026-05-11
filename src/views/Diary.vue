<template>
  <div class="diary-page" :class="currentTheme">
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()" aria-label="返回">‹</button>
      <div class="nav-title">日记</div>
      <button v-if="currentTab === 'mine'" class="nav-btn" @click="openEditor(selectedDateKey || todayKey)" aria-label="新增">＋</button>
      <button v-else class="nav-btn ghost" aria-label="占位">＋</button>
    </div>

    <div class="segmented">
      <button :class="{ active: currentTab === 'mine' }" @click="currentTab = 'mine'">我的</button>
      <button :class="{ active: currentTab === 'roles' }" @click="currentTab = 'roles'">角色</button>
    </div>

    <main class="content">
      <section v-if="currentTab === 'mine'">
        <div class="month-card">
          <div class="month-header">
            <button class="month-btn" @click="shiftMonth(-1)">‹</button>
            <div>
              <div class="month-title">{{ monthTitle }}</div>
              <div class="month-sub">{{ monthStats }}</div>
            </div>
            <button class="month-btn" @click="shiftMonth(1)">›</button>
          </div>

          <div class="week-row">
            <span v-for="day in weekDays" :key="day">{{ day }}</span>
          </div>

          <div class="calendar-grid">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              class="day-cell"
              :class="{ muted: !day.inMonth, today: day.key === todayKey, selected: day.key === selectedDateKey }"
              @click="openDay(day)"
            >
              <span class="day-num">{{ day.date }}</span>
              <span v-if="moodMap[day.key]" class="day-mood" :style="moodStyle(moodMap[day.key].moodId)">
                <MoodIcon :type="moodMap[day.key].moodId" />
              </span>
              <span v-if="diaryCount(day.key)" class="diary-mark"></span>
            </button>
          </div>
        </div>

        <div class="mood-strip">
          <div v-for="mood in moodSummary" :key="mood.id" class="mood-summary" :style="{ '--mood': mood.color }">
            <MoodIcon :type="mood.id" />
            <span>{{ mood.count }}</span>
          </div>
        </div>
      </section>

      <section v-else class="role-view">
        <div class="role-filter">
          <button :class="{ active: selectedRoleId === 'all' }" @click="selectedRoleId = 'all'">全部</button>
          <button
            v-for="role in roles"
            :key="role.id"
            :class="{ active: selectedRoleId === role.id }"
            @click="selectedRoleId = role.id"
          >
            <img :src="role.avatar || defaultAvatar" alt="" />
            <span>{{ role.name }}</span>
          </button>
        </div>

        <button class="generate-role-btn" @click="openGenerateDrawer">生成今日日记</button>

        <div v-if="filteredRoleDiaries.length === 0" class="empty-state">
          <div class="empty-title">还没有角色日记</div>
          <div class="empty-sub">之后可以从聊天里生成，也可以让角色主动写入。</div>
        </div>

        <article
          v-for="entry in filteredRoleDiaries"
          :key="entry.id"
          class="diary-card role-diary-card"
          @click="openRoleDiary(entry)"
        >
          <div class="role-card-head">
            <img :src="roleAvatar(entry.roleId)" alt="" />
            <div>
              <div class="role-card-name">{{ roleName(entry.roleId) }}</div>
              <div class="card-meta compact-meta">
                <span>{{ formatDateLabel(entry.dateKey) }}</span>
                <span>{{ sourceLabel(entry.source) }}</span>
                <span v-if="entry.includeInContext">已进记忆</span>
              </div>
            </div>
          </div>
          <h3>{{ displayDiary(entry).title }}</h3>
          <p>{{ displayDiary(entry).content }}</p>
        </article>
      </section>
    </main>

    <transition name="slide-up">
      <div v-if="showDayDrawer" class="drawer-overlay" @click.self="showDayDrawer = false">
        <div class="drawer-content compact scrollable-drawer">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <div>
              <h3>{{ formatDateLabel(selectedDateKey) }}</h3>
              <p>{{ selectedDayDiaries.length ? `${selectedDayDiaries.length} 篇记录` : '还没有写日记' }}</p>
            </div>
            <button class="text-btn" @click="openEditor(selectedDateKey)">写日记</button>
          </div>

          <div class="mood-picker">
            <button
              v-for="mood in moodOptions"
              :key="mood.id"
              :class="{ active: selectedMoodId === mood.id }"
              :style="{ '--mood': mood.color }"
              @click="saveMood(mood.id)"
            >
              <MoodIcon :type="mood.id" />
              <span>{{ mood.label }}</span>
            </button>
          </div>

          <div v-if="selectedDayDiaries.length === 0" class="day-empty">今天空着也没关系，愿意的时候再写。</div>

          <article
            v-for="entry in selectedDayDiaries"
            :key="entry.id"
            class="diary-card small"
            @click="openEditor(entry.dateKey, entry)"
          >
            <div class="card-meta">
              <span>{{ visibilityLabel(entry) }}</span>
              <span v-if="entry.includeInContext">已进记忆</span>
            </div>
            <h3>{{ displayDiary(entry).title }}</h3>
            <p>{{ displayDiary(entry).content }}</p>
            <div v-if="entry.aiReview" class="review-box">{{ entry.aiReview }}</div>
            <button
              v-if="entry.visibility === 'role_visible'"
              class="inline-action"
              :disabled="reviewingId === entry.id"
              @click.stop="reviewEntry(entry)"
            >
              {{ entry.aiReview ? '重新评价' : (reviewingId === entry.id ? '评价中...' : '让角色评价') }}
            </button>
          </article>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="showEditor" class="drawer-overlay" @click.self="closeEditor">
        <div class="drawer-content editor scrollable-drawer">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <div>
              <h3>{{ editingId ? '编辑我的日记' : '写日记' }}</h3>
              <p>我的日记可以选择私密，或指定角色可见。</p>
            </div>
            <button v-if="editingId" class="delete-btn" @click="deleteEntry">删除</button>
          </div>

          <div class="field-row">
            <label>日期</label>
            <input v-model="form.dateKey" type="date" />
          </div>

          <div class="field-row">
            <label>标题</label>
            <input v-model="form.title" maxlength="40" placeholder="给今天起个名字" />
          </div>

          <div class="editor-moods">
            <button
              v-for="mood in moodOptions"
              :key="mood.id"
              :class="{ active: form.moodId === mood.id }"
              :style="{ '--mood': mood.color }"
              @click="form.moodId = mood.id"
            >
              <MoodIcon :type="mood.id" />
              <span>{{ mood.label }}</span>
            </button>
          </div>

          <textarea v-model="form.content" class="diary-textarea" placeholder="写下今天想留下的事..." />

          <div class="option-panel visibility-panel">
            <div class="panel-title">可见范围</div>
            <div class="visibility-tabs">
              <button :class="{ active: !form.roleVisible }" @click="setPrivate">仅自己可见</button>
              <button :class="{ active: form.roleVisible }" @click="setRoleVisible">指定角色可见</button>
            </div>
            <label v-if="form.roleVisible" class="switch-row memory-row">
              <span>
                <b>作为聊天记忆</b>
                <small>开启后，选中的角色会在聊天时参考这篇日记。</small>
              </span>
              <input v-model="form.includeInContext" type="checkbox" class="wx-switch" />
            </label>
          </div>

          <div v-if="form.roleVisible" class="role-select-panel">
            <div class="panel-title">可见角色</div>
            <div class="role-checks">
              <button
                v-for="role in roles"
                :key="role.id"
                :class="{ active: form.linkedRoleIds.includes(role.id) }"
                @click="toggleRole(role.id)"
              >
                <img :src="role.avatar || defaultAvatar" alt="" />
                <span>{{ role.name }}</span>
              </button>
            </div>
          </div>

          <button class="save-btn sticky-save" @click="saveEntry">保存</button>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="showRoleDetail" class="drawer-overlay" @click.self="closeRoleDetail">
        <div class="drawer-content role-detail scrollable-drawer">
          <div class="drawer-handle"></div>
          <div class="role-detail-hero" v-if="selectedRoleDiary">
            <img class="role-detail-avatar" :src="roleAvatar(selectedRoleDiary.roleId)" alt="" />
            <div>
              <div class="role-detail-name">{{ roleName(selectedRoleDiary.roleId) }}</div>
              <div class="role-detail-meta">{{ formatDateLabel(selectedRoleDiary.dateKey) }} · {{ sourceLabel(selectedRoleDiary.source) }}</div>
            </div>
          </div>

          <article v-if="selectedRoleDiary" class="role-reading-card">
            <div class="reading-label">角色日记</div>
            <h2>{{ displayDiary(selectedRoleDiary).title }}</h2>
            <p>{{ displayDiary(selectedRoleDiary).content }}</p>
          </article>

          <div v-if="selectedRoleDiary" class="role-manage-panel">
            <label class="switch-row">
              <span>
                <b>作为聊天记忆</b>
                <small>开启后，这篇角色日记会进入对应角色的日记记忆。</small>
              </span>
              <input v-model="roleDetailIncludeInContext" type="checkbox" class="wx-switch" @change="saveRoleDiaryContext" />
            </label>
            <div class="linked-role-line">
              <span>关联角色</span>
              <div>
                <span v-for="name in selectedRoleNames" :key="name" class="role-chip">{{ name }}</span>
              </div>
            </div>
          </div>

          <div class="role-detail-actions" v-if="selectedRoleDiary">
            <button class="ghost-action" @click="copyRoleDiary">复制正文</button>
            <button class="danger-action" @click="deleteRoleDiary">删除日记</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="showGenerateDrawer" class="drawer-overlay" @click.self="showGenerateDrawer = false">
        <div class="drawer-content editor scrollable-drawer">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <div>
              <h3>生成角色日记</h3>
              <p>按时间段整理角色视角的记录</p>
            </div>
          </div>

          <div class="field-row">
            <label>角色</label>
            <select v-model.number="generateForm.roleId">
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>

          <div class="field-row">
            <label>开始时间</label>
            <input v-model="generateForm.start" type="datetime-local" />
          </div>

          <div class="field-row">
            <label>结束时间</label>
            <input v-model="generateForm.end" type="datetime-local" />
          </div>

          <label class="switch-row standalone option-panel">
            <span>生成后作为聊天记忆</span>
            <input v-model="generateForm.includeInContext" type="checkbox" class="wx-switch" />
          </label>

          <button class="save-btn sticky-save" :disabled="isGeneratingDiary" @click="generateRoleDiary">
            {{ isGeneratingDiary ? '正在整理...' : '生成日记' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiProfileService, dailyMoodService, diaryService, messageService, roleService } from '../services/db';
import { callClaude } from '../services/claude';
import { SYSTEM_THEME_KEY, initializeTheme } from '../utils/themeSync';
import { buildDiaryReviewSystemPrompt } from '../utils/promptBuilder';

const router = useRouter();
const route = useRoute();
const currentTheme = ref(initializeTheme().systemTheme || 'theme-minimal');
const currentTab = ref('mine');
const selectedMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const selectedDateKey = ref(toDateKey(new Date()));
const selectedRoleId = ref('all');
const showDayDrawer = ref(false);
const showEditor = ref(false);
const showGenerateDrawer = ref(false);
const showRoleDetail = ref(false);
const editingId = ref(null);
const selectedRoleDiary = ref(null);
const roleDetailIncludeInContext = ref(false);
const roles = ref([]);
const diaries = ref([]);
const moods = ref([]);
const allDiaries = ref([]);
const reviewingId = ref(null);
const isGeneratingDiary = ref(false);
const generateForm = ref(makeGenerateForm());

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
const todayKey = toDateKey(new Date());
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="44" height="44"%3E%3Crect fill="%23ddd" width="44" height="44" rx="10"/%3E%3Cpath fill="%23999" d="M22 11a7 7 0 100 14 7 7 0 000-14zm0 17c-5.2 0-9 3-9 6.8V37h18v-2.2C31 31 27.2 28 22 28z"/%3E%3C/svg%3E';

const moodOptions = [
  { id: 'happy', label: '明亮', color: '#f6b84b' },
  { id: 'calm', label: '平静', color: '#6b9fd6' },
  { id: 'sad', label: '低落', color: '#7c8fa8' },
  { id: 'tired', label: '疲惫', color: '#a883c8' },
  { id: 'angry', label: '烦躁', color: '#e46d56' },
  { id: 'anxious', label: '不安', color: '#68a88f' },
  { id: 'moved', label: '触动', color: '#e88aa3' },
  { id: 'blank', label: '空白', color: '#9d948b' }
];

const form = ref(makeEmptyForm(todayKey));

const moodMap = computed(() => Object.fromEntries(moods.value.map(item => [item.dateKey, item])));
const userDiaries = computed(() => diaries.value.filter(entry => entry.authorType === 'user'));
const roleOnlyDiaries = computed(() => allDiaries.value.filter(entry => entry.authorType === 'role'));

const monthKey = computed(() => {
  const date = selectedMonth.value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
});

const monthTitle = computed(() => {
  const date = selectedMonth.value;
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
});

const monthStats = computed(() => {
  const count = userDiaries.value.length;
  const moodCount = moods.value.filter(item => item.moodId).length;
  return `${count} 篇日记 · ${moodCount} 天心情`;
});

const calendarDays = computed(() => {
  const base = selectedMonth.value;
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: toDateKey(date), date: date.getDate(), inMonth: date.getMonth() === base.getMonth() };
  });
});

const selectedDayDiaries = computed(() => userDiaries.value.filter(entry => entry.dateKey === selectedDateKey.value).sort((a, b) => b.createdAt - a.createdAt));
const selectedMoodId = computed(() => moodMap.value[selectedDateKey.value]?.moodId || '');

const moodSummary = computed(() => moodOptions.map(mood => ({ ...mood, count: moods.value.filter(item => item.moodId === mood.id).length })).filter(mood => mood.count > 0));

const filteredRoleDiaries = computed(() => {
  const list = [...roleOnlyDiaries.value];
  if (selectedRoleId.value === 'all') return list.sort((a, b) => b.createdAt - a.createdAt);
  const roleId = Number(selectedRoleId.value);
  return list.filter(entry => entry.roleId === roleId || (entry.linkedRoleIds || []).includes(roleId)).sort((a, b) => b.createdAt - a.createdAt);
});

const selectedRoleNames = computed(() => {
  const entry = selectedRoleDiary.value;
  if (!entry) return [];
  const ids = entry.linkedRoleIds?.length ? entry.linkedRoleIds : [entry.roleId];
  return ids.map(roleName).filter(Boolean);
});

const MoodIcon = {
  props: { type: { type: String, default: 'blank' } },
  setup(props) {
    return () => {
      const common = { viewBox: '0 0 32 32', fill: 'none', class: 'mood-svg' };
      const stroke = { stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      const fill = { fill: 'currentColor' };
      const shapes = {
        happy: [
          h('circle', { cx: 16, cy: 16, r: 6.2, ...fill, opacity: 0.28 }),
          h('circle', { cx: 16, cy: 16, r: 4.2, ...fill }),
          h('path', { d: 'M16 3.8v4M16 24.2v4M4.6 16h4M23.4 16h4M7.9 7.9l2.8 2.8M21.3 21.3l2.8 2.8M24.1 7.9l-2.8 2.8M10.7 21.3l-2.8 2.8', ...stroke })
        ],
        calm: [
          h('path', { d: 'M21.8 5.4A11.2 11.2 0 1017 27.1 9.3 9.3 0 0121.8 5.4z', ...fill, opacity: 0.9 }),
          h('path', { d: 'M8 22.5c3.2-1.7 6.5-1.7 9.9 0 2.3 1.2 4.4 1.2 6.1 0', ...stroke, opacity: 0.7 })
        ],
        sad: [
          h('path', { d: 'M9.3 18.2h13.2a4.2 4.2 0 00.2-8.4 6.8 6.8 0 00-12.9 1.4 3.6 3.6 0 00-.5 7z', ...fill, opacity: 0.86 }),
          h('path', { d: 'M11 22l-1.5 3M17 22l-1.5 3M23 22l-1.5 3', ...stroke })
        ],
        tired: [
          h('path', { d: 'M9 13.4c0-5 3.1-8.1 7-8.1s7 3.1 7 8.1v3.2c0 5.1-3 8.1-7 8.1s-7-3-7-8.1v-3.2z', ...fill, opacity: 0.18 }),
          h('path', { d: 'M10.8 13.2c1.1.8 2.4.8 3.5 0M17.7 13.2c1.1.8 2.4.8 3.5 0M13 20.2c1.9-.8 4.1-.8 6 0', ...stroke }),
          h('path', { d: 'M23.2 5.2h3.4l-3.4 3.7h3.4M24.6 11.3h2.5l-2.5 2.8h2.5', ...stroke, opacity: 0.68 })
        ],
        angry: [
          h('path', { d: 'M17.7 3.8c1.1 4.8 6.2 6.5 6.2 13.1 0 5.1-3.7 9.1-8.1 9.1-4.8 0-8.2-3.5-8.2-8.2 0-4.4 3-6.9 5.7-10.2.3 2.3 1.2 3.8 2.8 4.7.2-3 .6-5.7 1.6-8.5z', ...fill, opacity: 0.9 }),
          h('path', { d: 'M13 20c1.7 1 4.3 1 6 0', ...stroke, opacity: 0.7 })
        ],
        anxious: [
          h('path', { d: 'M16 5.5c6.2 0 10.7 4.5 10.7 10.1 0 6-4.6 10.1-10.7 10.1-5.7 0-10.7-3.8-10.7-9.6 0-5.4 4.1-8.6 8.8-8.6 4.3 0 7.3 2.8 7.3 6.4 0 3.7-2.8 6.2-6.4 6.2-3.1 0-5.2-1.8-5.2-4.3 0-2.2 1.6-3.6 3.7-3.6 1.6 0 2.8 1 2.8 2.4', ...stroke })
        ],
        moved: [
          h('path', { d: 'M16 26s-9.7-5.8-9.7-13.2c0-3.6 2.4-6.2 5.6-6.2 1.9 0 3.4 1 4.1 2.5.7-1.5 2.2-2.5 4.1-2.5 3.2 0 5.6 2.6 5.6 6.2C25.7 20.2 16 26 16 26z', ...fill, opacity: 0.88 }),
          h('path', { d: 'M5 6.2l2-2M26.8 6.2l-2-2M28.2 16h-2.6M6.4 16H3.8', ...stroke, opacity: 0.72 })
        ],
        blank: [
          h('rect', { x: 8, y: 7, width: 16, height: 18, rx: 5, ...fill, opacity: 0.82 }),
          h('path', { d: 'M12 13h8M12 18h5', ...stroke, stroke: '#fff', opacity: 0.8 })
        ]
      };
      return h('svg', common, shapes[props.type] || shapes.blank);
    };
  }
};

function makeEmptyForm(dateKey) {
  return { dateKey, title: '', content: '', moodId: '', roleVisible: false, includeInContext: false, linkedRoleIds: [] };
}

function makeGenerateForm(roleId = null) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return { roleId, start: toDateTimeInput(start), end: toDateTimeInput(now), includeInContext: true };
}

function toDateKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateTimeInput(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || todayKey).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function diaryCount(dateKey) {
  return userDiaries.value.filter(entry => entry.dateKey === dateKey).length;
}

function moodStyle(moodId) {
  const mood = moodOptions.find(item => item.id === moodId);
  return { '--mood': mood?.color || '#9d948b' };
}

function formatDateLabel(dateKey) {
  if (!dateKey) return '';
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function visibilityLabel(entry) {
  if (entry.visibility === 'role_visible') {
    const count = entry.linkedRoleIds?.length || (entry.roleId ? 1 : 0);
    return count > 1 ? `${count} 个角色可见` : '角色可见';
  }
  return '私密';
}

function roleName(roleId) {
  const role = roles.value.find(item => item.id === Number(roleId));
  return role?.name || '未关联角色';
}

function roleAvatar(roleId) {
  const role = roles.value.find(item => item.id === Number(roleId));
  return role?.avatar || defaultAvatar;
}

function sourceLabel(source) {
  if (source === 'directive') return '聊天写入';
  if (source === 'generated') return '整理生成';
  return '手动记录';
}

function setPrivate() {
  form.value.roleVisible = false;
  form.value.includeInContext = false;
}

function setRoleVisible() {
  form.value.roleVisible = true;
}

async function loadData() {
  roles.value = await roleService.getAll();
  diaries.value = await diaryService.getByMonth(monthKey.value);
  moods.value = await dailyMoodService.getByMonth(monthKey.value);
  allDiaries.value = await diaryService.getAll();
  if (!generateForm.value.roleId && roles.value.length > 0) generateForm.value.roleId = roles.value[0].id;
}

async function openDiaryFromRoute() {
  const diaryId = Number(route.query.diaryId);
  if (!diaryId) return;
  const entry = await diaryService.getById(diaryId);
  if (!entry) return;
  if (entry.authorType === 'role') {
    currentTab.value = 'roles';
    openRoleDiary(entry);
    return;
  }
  currentTab.value = 'mine';
  selectedDateKey.value = entry.dateKey || todayKey;
  openEditor(selectedDateKey.value, entry);
}

async function resolveRoleWithApi(roleId) {
  const baseRole = await roleService.getById(roleId);
  if (!baseRole) throw new Error('角色不存在');
  if (baseRole.apiProfileId) {
    const apiProfile = await apiProfileService.getById(baseRole.apiProfileId);
    if (apiProfile) return { ...baseRole, apiKey: apiProfile.apiKey, baseUrl: apiProfile.baseUrl, model: apiProfile.model, apiFormat: apiProfile.apiFormat };
  }
  const profiles = await apiProfileService.getAll();
  if (profiles.length === 0) throw new Error('请先配置 API 方案');
  const profile = profiles[0];
  return { ...baseRole, apiKey: profile.apiKey, baseUrl: profile.baseUrl, model: profile.model, apiFormat: profile.apiFormat };
}

function formatTranscript(messages = []) {
  return messages.map((message) => {
    const time = new Date(message.timestamp);
    const h = String(time.getHours()).padStart(2, '0');
    const m = String(time.getMinutes()).padStart(2, '0');
    const speaker = message.role === 'user' ? '用户' : '角色';
    const content = message.type === 'image' ? '[图片]' : message.audioUrl ? `[语音:${message.content}]` : message.content;
    return `${h}:${m} ${speaker}: ${content}`;
  }).join('\n');
}

function stripCodeFence(text = '') {
  return String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function tryParseDiaryJson(text = '') {
  const clean = stripCodeFence(text);
  const candidates = [clean];
  const fenced = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.unshift(clean.slice(firstBrace, lastBrace + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && (parsed.title || parsed.content)) {
        return { title: String(parsed.title || '').trim(), content: String(parsed.content || '').trim() };
      }
    } catch {}
  }
  const titleMatch = clean.match(/["“]?title["”]?\s*[:：]\s*["“]([^"”\n]+)["”]?/i) || clean.match(/标题\s*[:：]\s*(.+)/);
  const contentMatch = clean.match(/["“]?content["”]?\s*[:：]\s*["“]([\s\S]*?)(?:"\s*[,}]\s*$|”\s*[,}]\s*$|$)/i) || clean.match(/正文\s*[:：]\s*([\s\S]+)/);
  if (titleMatch || contentMatch) return { title: String(titleMatch?.[1] || '').trim(), content: String(contentMatch?.[1] || clean).replace(/\\n/g, '\n').replace(/\\(["\\])/g, '$1').replace(/["”]\s*[,}]?\s*$/g, '').trim() };
  return null;
}

function parseDiaryResponse(text, fallbackDateKey) {
  const parsed = tryParseDiaryJson(text);
  if (parsed) return { title: parsed.title || `${formatDateLabel(fallbackDateKey)}的日记`, content: parsed.content };
  return { title: `${formatDateLabel(fallbackDateKey)}的日记`, content: stripCodeFence(text) };
}

function displayDiary(entry) {
  const parsed = tryParseDiaryJson(entry?.content);
  if (!parsed) return entry || { title: '', content: '' };
  return { ...entry, title: parsed.title || entry.title, content: parsed.content || entry.content };
}

function shiftMonth(delta) {
  const date = selectedMonth.value;
  selectedMonth.value = new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function openDay(day) {
  selectedDateKey.value = day.key;
  if (!day.inMonth) {
    const date = parseDateKey(day.key);
    selectedMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  showDayDrawer.value = true;
}

async function saveMood(moodId) {
  await dailyMoodService.set(selectedDateKey.value, moodId);
  await loadData();
}

function openGenerateDrawer() {
  const roleId = selectedRoleId.value !== 'all' ? Number(selectedRoleId.value) : roles.value[0]?.id;
  generateForm.value = makeGenerateForm(roleId || null);
  showGenerateDrawer.value = true;
}

async function reviewEntry(entry) {
  const targetRoleId = entry.linkedRoleIds?.[0] || entry.roleId;
  if (!targetRoleId) return alert('这篇日记还没有选择可见角色');
  try {
    reviewingId.value = entry.id;
    const role = await resolveRoleWithApi(targetRoleId);
    const diary = displayDiary(entry);
    const contextLength = role.chatSettings?.contextLength || 15;
    const contextMessages = await messageService.getCombinedContext(targetRoleId, contextLength);
    const apiMessages = [
      ...contextMessages.map(toDiaryReviewMessage),
      { role: 'user', content: `这是我的日记：\n标题：${diary.title}\n正文：${diary.content}\n请你评价或回应一下。` }
    ];
    const systemPrompt = await buildDiaryReviewSystemPrompt(role, contextMessages, diary);
    const response = await callClaude({ ...role, systemPrompt, skipSystemPromptMerge: true }, apiMessages);
    await diaryService.update(entry.id, { ...entry, aiReview: response.trim(), aiReviewRoleId: targetRoleId, aiReviewedAt: Date.now() });
    await loadData();
  } catch (error) {
    alert(error.message || '评价失败');
  } finally {
    reviewingId.value = null;
  }
}

function toDiaryReviewMessage(message) {
  const content = message.type === 'image' ? '[图片]' : message.audioUrl ? `[语音:${message.content}]` : message.content;
  return {
    role: message.role === 'user' ? 'user' : 'assistant',
    content: String(content || '')
  };
}

function openEditor(dateKey, entry = null) {
  if (entry?.authorType === 'role') return openRoleDiary(entry);
  editingId.value = entry?.id || null;
  const display = entry ? displayDiary(entry) : null;
  form.value = entry ? {
    dateKey: entry.dateKey || dateKey,
    title: display.title || '',
    content: display.content || '',
    moodId: entry.moodId || '',
    roleVisible: entry.visibility === 'role_visible',
    includeInContext: !!entry.includeInContext,
    linkedRoleIds: [...(entry.linkedRoleIds || (entry.roleId ? [entry.roleId] : []))]
  } : makeEmptyForm(dateKey || todayKey);
  showDayDrawer.value = false;
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
  editingId.value = null;
  form.value = makeEmptyForm(selectedDateKey.value || todayKey);
}

function toggleRole(roleId) {
  const ids = form.value.linkedRoleIds;
  form.value.linkedRoleIds = ids.includes(roleId) ? ids.filter(id => id !== roleId) : [...ids, roleId];
}

async function saveEntry() {
  const title = form.value.title.trim() || '未命名日记';
  const content = form.value.content.trim();
  if (!content) return alert('日记正文不能为空');
  if (form.value.roleVisible && form.value.linkedRoleIds.length === 0) return alert('请选择至少一个可见角色');
  const data = {
    authorType: 'user',
    dateKey: form.value.dateKey,
    title,
    content,
    moodId: form.value.moodId,
    visibility: form.value.roleVisible ? 'role_visible' : 'private',
    includeInContext: form.value.roleVisible && form.value.includeInContext,
    linkedRoleIds: form.value.roleVisible ? form.value.linkedRoleIds : []
  };
  if (editingId.value) await diaryService.update(editingId.value, data);
  else await diaryService.create(data);
  selectedDateKey.value = form.value.dateKey;
  closeEditor();
  await loadData();
  showDayDrawer.value = true;
}

async function deleteEntry() {
  if (!editingId.value) return;
  if (!confirm('确定删除这篇日记吗？')) return;
  await diaryService.delete(editingId.value);
  closeEditor();
  await loadData();
}

function openRoleDiary(entry) {
  selectedRoleDiary.value = entry;
  roleDetailIncludeInContext.value = !!entry.includeInContext;
  showRoleDetail.value = true;
}

function closeRoleDetail() {
  showRoleDetail.value = false;
  selectedRoleDiary.value = null;
}

async function saveRoleDiaryContext() {
  if (!selectedRoleDiary.value) return;
  const updated = await diaryService.update(selectedRoleDiary.value.id, {
    ...selectedRoleDiary.value,
    includeInContext: roleDetailIncludeInContext.value,
    visibility: 'role_visible',
    linkedRoleIds: selectedRoleDiary.value.linkedRoleIds?.length ? selectedRoleDiary.value.linkedRoleIds : [selectedRoleDiary.value.roleId]
  });
  selectedRoleDiary.value = updated;
  await loadData();
}

async function copyRoleDiary() {
  if (!selectedRoleDiary.value) return;
  const diary = displayDiary(selectedRoleDiary.value);
  const text = `${diary.title}\n\n${diary.content}`;
  try {
    await navigator.clipboard.writeText(text);
    alert('已复制');
  } catch {
    alert(text);
  }
}

async function deleteRoleDiary() {
  if (!selectedRoleDiary.value) return;
  if (!confirm('确定删除这篇角色日记吗？')) return;
  await diaryService.delete(selectedRoleDiary.value.id);
  closeRoleDetail();
  await loadData();
}

async function generateRoleDiary() {
  const roleId = Number(generateForm.value.roleId);
  if (!roleId) return alert('请选择角色');
  const startAt = new Date(generateForm.value.start).getTime();
  const endAt = new Date(generateForm.value.end).getTime();
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || startAt >= endAt) return alert('请选择正确的时间范围');
  try {
    isGeneratingDiary.value = true;
    const messages = await messageService.getByRoleTimeRange(roleId, startAt, endAt);
    if (messages.length === 0) return alert('这个时间段没有聊天记录');
    const role = await resolveRoleWithApi(roleId);
    const transcript = formatTranscript(messages);
    const dateKey = toDateKey(endAt);
    const response = await callClaude({ ...role, skipSystemPromptMerge: true, systemPrompt: '你正在为自己写一篇私人角色日记。请只输出 JSON：{"title":"标题","content":"第一人称日记正文"}。不要输出代码块，不要总结成报告，要像你真的在记录这一天。' }, [
      { role: 'user', content: `请根据以下聊天记录，写一篇你的第一人称角色日记。\n\n${transcript}` }
    ]);
    const parsed = parseDiaryResponse(response, dateKey);
    await diaryService.create({ authorType: 'role', roleId, linkedRoleIds: [roleId], dateKey, title: parsed.title, content: parsed.content, visibility: 'role_visible', includeInContext: generateForm.value.includeInContext, startAt, endAt, source: 'generated' });
    showGenerateDrawer.value = false;
    await loadData();
  } catch (error) {
    alert(error.message || '生成失败');
  } finally {
    isGeneratingDiary.value = false;
  }
}

const syncTheme = (event) => {
  currentTheme.value = event?.detail?.systemTheme || localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
};

watch(monthKey, loadData);
onMounted(async () => {
  await loadData();
  await openDiaryFromRoute();
  window.addEventListener('storage', syncTheme);
  window.addEventListener('xiaoshouji-theme-change', syncTheme);
});
onUnmounted(() => {
  window.removeEventListener('storage', syncTheme);
  window.removeEventListener('xiaoshouji-theme-change', syncTheme);
});
</script>

<style scoped>
.diary-page {
  --diary-bg: #f5f4ed;
  --diary-card-bg: #faf9f5;
  --diary-text: #5c504d;
  --diary-sub: #9e938f;
  --diary-accent: #d97757;
  --diary-soft: rgba(0, 0, 0, .055);
  --diary-shadow: rgba(217, 119, 87, .08);
  min-height: 100vh;
  background: var(--diary-bg);
  color: var(--diary-text);
  padding-bottom: 22px;
}
.diary-page.theme-nordic {
  --diary-bg: #f0f4f8;
  --diary-card-bg: #ffffff;
  --diary-text: #2c3e50;
  --diary-sub: #7f8c8d;
  --diary-accent: #6b8ea5;
  --diary-soft: rgba(107, 142, 165, .1);
  --diary-shadow: rgba(107, 142, 165, .08);
}
.diary-page.theme-data {
  --diary-bg: #1e2024;
  --diary-card-bg: #2a2d34;
  --diary-text: #e0e6ed;
  --diary-sub: #8892b0;
  --diary-accent: #40d1af;
  --diary-soft: rgba(255, 255, 255, .07);
  --diary-shadow: rgba(0, 0, 0, .28);
}
.nav-bar { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; background: var(--diary-bg); position: sticky; top: 0; z-index: 20; }
.nav-title { font-size: 18px; font-weight: 700; }
.nav-btn, .month-btn { border: none; background: transparent; color: inherit; width: 36px; height: 36px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
.nav-btn.ghost { opacity: 0; pointer-events: none; }
.segmented { margin: 4px 16px 14px; padding: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: var(--diary-soft); border-radius: 14px; }
.segmented button { border: none; border-radius: 11px; background: transparent; padding: 9px; color: var(--diary-sub); font-size: 15px; }
.segmented button.active { background: var(--diary-card-bg); color: var(--diary-text); box-shadow: 0 2px 8px var(--diary-shadow); }
.content { padding: 0 16px; }
.month-card, .diary-card, .drawer-content, .option-panel, .role-select-panel, .role-manage-panel, .role-reading-card { background: var(--diary-card-bg); border-radius: 20px; box-shadow: 0 10px 28px var(--diary-shadow); }
.month-card { padding: 16px; }
.month-header { display: flex; align-items: center; justify-content: space-between; text-align: center; }
.month-title { font-size: 18px; font-weight: 700; }
.month-sub { margin-top: 3px; font-size: 12px; color: var(--diary-sub); }
.week-row, .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.week-row { margin-top: 18px; color: var(--diary-sub); font-size: 12px; text-align: center; }
.calendar-grid { gap: 6px; margin-top: 8px; }
.day-cell { position: relative; aspect-ratio: 1 / 1; min-height: 44px; border: none; border-radius: 14px; background: transparent; color: inherit; }
.day-cell.muted { opacity: .35; }
.day-cell.today { background: color-mix(in srgb, var(--diary-accent) 14%, transparent); }
.day-cell.selected { outline: 2px solid color-mix(in srgb, var(--diary-accent) 36%, transparent); }
.day-num { position: absolute; top: 7px; left: 8px; z-index: 2; font-size: 13px; line-height: 1; }
.day-mood { position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%); color: var(--mood); }
.mood-svg { width: 20px; height: 20px; display: block; }
.diary-mark { position: absolute; left: 50%; bottom: 3px; width: 19px; height: 4px; transform: translateX(-50%); border-radius: 999px; background: color-mix(in srgb, var(--diary-accent) 72%, transparent); opacity: .78; }
.mood-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.mood-summary { color: var(--mood); display: flex; align-items: center; gap: 4px; padding: 7px 10px; border-radius: 999px; background: var(--diary-card-bg); font-size: 12px; }
.role-filter { display: flex; overflow-x: auto; gap: 8px; padding: 2px 0 12px; }
.role-filter button, .role-checks button { border: none; background: var(--diary-card-bg); color: inherit; border-radius: 999px; padding: 7px 12px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.role-filter button.active, .role-checks button.active { background: var(--diary-accent); color: #fff; }
.role-filter img, .role-checks img { width: 24px; height: 24px; border-radius: 999px; object-fit: cover; }
.generate-role-btn, .save-btn { width: 100%; border: none; border-radius: 16px; padding: 13px 16px; color: #fff; background: var(--diary-accent); font-size: 15px; font-weight: 700; margin-bottom: 12px; }
.save-btn:disabled { opacity: .55; }
.empty-state { padding: 36px 10px; text-align: center; color: var(--diary-sub); }
.empty-title { font-weight: 700; color: var(--diary-text); margin-bottom: 6px; }
.diary-card { padding: 15px; margin-bottom: 12px; }
.diary-card h3 { margin: 9px 0 7px; font-size: 17px; }
.diary-card p { margin: 0; color: var(--diary-sub); line-height: 1.65; white-space: pre-wrap; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { display: flex; gap: 8px; flex-wrap: wrap; color: var(--diary-sub); font-size: 12px; }
.compact-meta { margin-top: 2px; }
.role-card-head { display: flex; align-items: center; gap: 10px; }
.role-card-head img { width: 38px; height: 38px; border-radius: 12px; object-fit: cover; }
.role-card-name { font-weight: 700; }
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.28); z-index: 50; display: flex; align-items: flex-end; overflow: hidden; }
.drawer-content { width: 100%; border-radius: 24px 24px 0 0; padding: 10px 16px calc(28px + env(safe-area-inset-bottom)); box-sizing: border-box; }
.scrollable-drawer { height: min(88dvh, 760px); max-height: 88dvh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.drawer-content.editor, .drawer-content.role-detail { height: min(92dvh, 820px); max-height: 92dvh; }
.drawer-handle { width: 42px; height: 5px; border-radius: 999px; background: rgba(0,0,0,.16); margin: 2px auto 14px; }
.drawer-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.drawer-header h3 { margin: 0; font-size: 19px; }
.drawer-header p { margin: 4px 0 0; color: var(--diary-sub); font-size: 12px; }
.text-btn, .delete-btn, .inline-action, .ghost-action, .danger-action { border: none; background: transparent; color: var(--diary-accent); font-size: 14px; }
.delete-btn, .danger-action { color: #e5534b; }
.mood-picker, .editor-moods { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.mood-picker button, .editor-moods button { border: none; border-radius: 999px; padding: 7px 10px; background: var(--diary-soft); color: var(--diary-sub); display: flex; align-items: center; gap: 4px; }
.mood-picker button.active, .editor-moods button.active { color: var(--mood); background: color-mix(in srgb, var(--mood) 13%, transparent); }
.day-empty { padding: 24px 10px; color: var(--diary-sub); text-align: center; }
.review-box { margin-top: 10px; padding: 10px; background: color-mix(in srgb, var(--diary-accent) 10%, transparent); border-radius: 12px; line-height: 1.55; font-size: 14px; }
.inline-action { margin-top: 8px; padding: 0; }
.field-row { margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
.field-row label { font-size: 13px; color: var(--diary-sub); }
.field-row input, .field-row select, .diary-textarea { border: none; border-radius: 14px; background: var(--diary-soft); color: inherit; padding: 12px; font-size: 15px; outline: none; }
.diary-textarea { min-height: 150px; resize: vertical; width: 100%; box-sizing: border-box; line-height: 1.6; }
.option-panel, .role-select-panel, .role-manage-panel { padding: 12px; margin: 12px 0; box-shadow: none; }
.visibility-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.visibility-tabs button { border: none; border-radius: 14px; padding: 12px 8px; background: var(--diary-soft); color: var(--diary-sub); font-weight: 700; }
.visibility-tabs button.active { background: color-mix(in srgb, var(--diary-accent) 13%, transparent); color: var(--diary-accent); }
.switch-row { min-height: 42px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.memory-row { margin-top: 12px; }
.switch-row small { display: block; margin-top: 3px; color: var(--diary-sub); font-weight: 400; line-height: 1.35; }
.wx-switch { width: 46px; height: 26px; flex-shrink: 0; }
.panel-title { font-size: 13px; color: var(--diary-sub); margin-bottom: 10px; }
.role-checks { display: flex; flex-wrap: wrap; gap: 8px; }
.sticky-save { position: sticky; bottom: calc(8px + env(safe-area-inset-bottom)); margin-top: 14px; box-shadow: 0 10px 24px color-mix(in srgb, var(--diary-accent) 28%, transparent); }
.role-detail-hero { display: flex; align-items: center; gap: 12px; padding: 6px 2px 14px; }
.role-detail-avatar { width: 48px; height: 48px; border-radius: 16px; object-fit: cover; }
.role-detail-name { font-size: 18px; font-weight: 800; }
.role-detail-meta { margin-top: 3px; color: var(--diary-sub); font-size: 13px; }
.role-reading-card { padding: 18px; box-shadow: none; }
.reading-label { color: var(--diary-accent); font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.role-reading-card h2 { margin: 0 0 12px; font-size: 22px; }
.role-reading-card p { margin: 0; white-space: pre-wrap; line-height: 1.8; font-size: 16px; color: var(--diary-text); }
.linked-role-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--diary-sub); font-size: 13px; padding-top: 10px; }
.role-chip { display: inline-flex; margin: 3px; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, var(--diary-accent) 11%, transparent); color: var(--diary-accent); }
.role-detail-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.ghost-action, .danger-action { background: var(--diary-soft); border-radius: 14px; padding: 12px; }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity .18s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; }
.slide-up-enter-active .drawer-content, .slide-up-leave-active .drawer-content { transition: transform .2s ease; }
.slide-up-enter-from .drawer-content, .slide-up-leave-to .drawer-content { transform: translateY(20px); }
[data-theme="dark"] .field-row input, [data-theme="dark"] .field-row select, [data-theme="dark"] .diary-textarea, [data-theme="dark"] .visibility-tabs button, [data-theme="dark"] .ghost-action, [data-theme="dark"] .danger-action { background: rgba(255,255,255,.08); }
</style>
