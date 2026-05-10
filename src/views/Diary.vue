<template>
  <div class="diary-page" :class="currentTheme">
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()" aria-label="返回">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="nav-title">日记</div>
      <button class="nav-btn" @click="openEditor(selectedDateKey || todayKey)" aria-label="新增">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>

    <div class="segmented">
      <button :class="{ active: currentTab === 'mine' }" @click="currentTab = 'mine'">我的</button>
      <button :class="{ active: currentTab === 'roles' }" @click="currentTab = 'roles'">角色</button>
    </div>

    <main class="content">
      <section v-if="currentTab === 'mine'" class="calendar-view">
        <div class="month-card">
          <div class="month-header">
            <button class="month-btn" @click="shiftMonth(-1)" aria-label="上个月">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div>
              <div class="month-title">{{ monthTitle }}</div>
              <div class="month-sub">{{ monthStats }}</div>
            </div>
            <button class="month-btn" @click="shiftMonth(1)" aria-label="下个月">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
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

        <button class="generate-role-btn" @click="openGenerateDrawer">
          生成今日日记
        </button>

        <div v-if="filteredRoleDiaries.length === 0" class="empty-state">
          <div class="empty-title">还没有角色日记</div>
          <div class="empty-sub">之后可以从聊天里生成，也可以让角色用特殊格式主动写入。</div>
        </div>

        <article
          v-for="entry in filteredRoleDiaries"
          :key="entry.id"
          class="diary-card"
          @click="openEditor(entry.dateKey, entry)"
        >
          <div class="card-meta">
            <span>{{ formatDateLabel(entry.dateKey) }}</span>
            <span>{{ roleName(entry.roleId) }}</span>
          </div>
          <h3>{{ entry.title }}</h3>
          <p>{{ displayDiary(entry).content }}</p>
        </article>
      </section>
    </main>

    <transition name="slide-up">
      <div v-if="showDayDrawer" class="drawer-overlay" @click.self="showDayDrawer = false">
        <div class="drawer-content compact">
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
        <div class="drawer-content editor">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <h3>{{ editingId ? '编辑日记' : '写日记' }}</h3>
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

          <div class="option-panel">
            <label class="switch-row">
              <span>允许角色看到</span>
              <input v-model="form.roleVisible" type="checkbox" class="wx-switch" />
            </label>
            <label v-if="form.roleVisible" class="switch-row">
              <span>作为聊天记忆</span>
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

          <button class="save-btn" @click="saveEntry">保存</button>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="showGenerateDrawer" class="drawer-overlay" @click.self="showGenerateDrawer = false">
        <div class="drawer-content editor">
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

          <label class="switch-row standalone">
            <span>生成后作为聊天记忆</span>
            <input v-model="generateForm.includeInContext" type="checkbox" class="wx-switch" />
          </label>

          <button class="save-btn" :disabled="isGeneratingDiary" @click="generateRoleDiary">
            {{ isGeneratingDiary ? '正在整理...' : '生成日记' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiProfileService, dailyMoodService, diaryService, messageService, roleService } from '../services/db';
import { callClaude } from '../services/claude';
import { SYSTEM_THEME_KEY, initializeTheme } from '../utils/themeSync';

const router = useRouter();
const currentTheme = ref(initializeTheme().systemTheme || 'theme-minimal');
const currentTab = ref('mine');
const selectedMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const selectedDateKey = ref(toDateKey(new Date()));
const selectedRoleId = ref('all');
const showDayDrawer = ref(false);
const showEditor = ref(false);
const showGenerateDrawer = ref(false);
const editingId = ref(null);
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
    return {
      key: toDateKey(date),
      date: date.getDate(),
      inMonth: date.getMonth() === base.getMonth()
    };
  });
});

const selectedDayDiaries = computed(() => {
  return userDiaries.value
    .filter(entry => entry.dateKey === selectedDateKey.value)
    .sort((a, b) => b.createdAt - a.createdAt);
});

const selectedMoodId = computed(() => moodMap.value[selectedDateKey.value]?.moodId || '');

const moodSummary = computed(() => {
  return moodOptions
    .map(mood => ({
      ...mood,
      count: moods.value.filter(item => item.moodId === mood.id).length
    }))
    .filter(mood => mood.count > 0);
});

const filteredRoleDiaries = computed(() => {
  const roleDiaries = allDiaries.value.filter(entry => entry.authorType === 'role' || entry.visibility === 'role_visible');
  if (selectedRoleId.value === 'all') {
    return roleDiaries.sort((a, b) => b.createdAt - a.createdAt);
  }
  const roleId = Number(selectedRoleId.value);
  return roleDiaries
    .filter(entry => entry.roleId === roleId || (entry.linkedRoleIds || []).includes(roleId))
    .sort((a, b) => b.createdAt - a.createdAt);
});

const MoodIcon = {
  props: {
    type: { type: String, default: 'blank' }
  },
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
          h('path', { d: 'M16 4.2l3.1 7.2 7.7.7-5.8 5.1 1.7 7.6L16 20.9l-6.7 3.9 1.7-7.6-5.8-5.1 7.7-.7L16 4.2z', ...fill, opacity: 0.82 }),
          h('path', { d: 'M11 18.5c2.7 1.5 7.3 1.5 10 0', ...stroke, opacity: 0.62 })
        ],
        angry: [
          h('path', { d: 'M17.7 3.8c1.1 4.8 6.2 6.5 6.2 13.1 0 5.1-3.7 9.1-8.1 9.1-4.8 0-8.2-3.5-8.2-8.2 0-4.4 3-6.9 5.7-10.2.3 2.3 1.2 3.8 2.8 4.7.2-3 .6-5.7 1.6-8.5z', ...fill, opacity: 0.9 }),
          h('path', { d: 'M13 20c1.7 1 4.3 1 6 0', ...stroke, opacity: 0.7 })
        ],
        anxious: [
          h('path', { d: 'M16 5.5c6.2 0 10.7 4.5 10.7 10.1 0 6-4.6 10.1-10.7 10.1-5.7 0-10.7-3.8-10.7-9.6 0-5.4 4.1-8.6 8.8-8.6 4.3 0 7.3 2.8 7.3 6.4 0 3.7-2.8 6.2-6.4 6.2-3.1 0-5.2-1.8-5.2-4.3 0-2.2 1.6-3.6 3.7-3.6 1.6 0 2.8 1 2.8 2.4', ...stroke }),
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
  return {
    dateKey,
    title: '',
    content: '',
    moodId: '',
    roleVisible: false,
    includeInContext: false,
    linkedRoleIds: []
  };
}

function makeGenerateForm(roleId = null) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return {
    roleId,
    start: toDateTimeInput(start),
    end: toDateTimeInput(now),
    includeInContext: true
  };
}

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateTimeInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
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

async function loadData() {
  roles.value = await roleService.getAll();
  diaries.value = await diaryService.getByMonth(monthKey.value);
  moods.value = await dailyMoodService.getByMonth(monthKey.value);
  allDiaries.value = await diaryService.getAll();
  if (!generateForm.value.roleId && roles.value.length > 0) {
    generateForm.value.roleId = roles.value[0].id;
  }
}

async function resolveRoleWithApi(roleId) {
  const baseRole = await roleService.getById(roleId);
  if (!baseRole) throw new Error('角色不存在');

  if (baseRole.apiProfileId) {
    const apiProfile = await apiProfileService.getById(baseRole.apiProfileId);
    if (apiProfile) {
      return {
        ...baseRole,
        apiKey: apiProfile.apiKey,
        baseUrl: apiProfile.baseUrl,
        model: apiProfile.model,
        apiFormat: apiProfile.apiFormat
      };
    }
  }

  const profiles = await apiProfileService.getAll();
  if (profiles.length === 0) throw new Error('请先配置 API 方案');
  const profile = profiles[0];
  return {
    ...baseRole,
    apiKey: profile.apiKey,
    baseUrl: profile.baseUrl,
    model: profile.model,
    apiFormat: profile.apiFormat
  };
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
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function tryParseDiaryJson(text = '') {
  const clean = stripCodeFence(text);
  const candidates = [clean];
  const fenced = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.unshift(clean.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && (parsed.title || parsed.content)) {
        return {
          title: String(parsed.title || '').trim(),
          content: String(parsed.content || '').trim()
        };
      }
    } catch {
      // Keep trying looser fallbacks.
    }
  }

  const titleMatch = clean.match(/["“]?title["”]?\s*[:：]\s*["“]([^"”\n]+)["”]?/i)
    || clean.match(/标题\s*[:：]\s*(.+)/);
  const contentMatch = clean.match(/["“]?content["”]?\s*[:：]\s*["“]([\s\S]*?)(?:"\s*[,}]\s*$|”\s*[,}]\s*$|$)/i)
    || clean.match(/正文\s*[:：]\s*([\s\S]+)/);

  if (titleMatch || contentMatch) {
    return {
      title: String(titleMatch?.[1] || '').trim(),
      content: String(contentMatch?.[1] || clean)
        .replace(/\\n/g, '\n')
        .replace(/\\(["\\])/g, '$1')
        .replace(/["”]\s*[,}]?\s*$/g, '')
        .trim()
    };
  }

  return null;
}

function parseDiaryResponse(text, fallbackDateKey) {
  const parsed = tryParseDiaryJson(text);
  if (parsed) {
    return {
      title: String(parsed.title || '').trim() || `${formatDateLabel(fallbackDateKey)}的日记`,
      content: String(parsed.content || '').trim()
    };
  }

  const clean = stripCodeFence(text);
  return {
    title: `${formatDateLabel(fallbackDateKey)}的日记`,
    content: clean
  };
}

function displayDiary(entry) {
  const parsed = tryParseDiaryJson(entry?.content);
  if (!parsed) return entry;
  return {
    ...entry,
    title: parsed.title || entry.title,
    content: parsed.content || entry.content
  };
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
  const roleId = selectedRoleId.value !== 'all'
    ? Number(selectedRoleId.value)
    : roles.value[0]?.id;
  generateForm.value = makeGenerateForm(roleId || null);
  showGenerateDrawer.value = true;
}

async function reviewEntry(entry) {
  const targetRoleId = entry.linkedRoleIds?.[0] || entry.roleId;
  if (!targetRoleId) {
    alert('这篇日记还没有选择可见角色');
    return;
  }

  try {
    reviewingId.value = entry.id;
    const role = await resolveRoleWithApi(targetRoleId);
    const systemPrompt = [
      `你是${role.name || '这个角色'}。`,
      '用户允许你阅读下面这篇日记。请以你的角色身份，给出一段自然、克制、真诚的评价。',
      '不要写成报告，不要提及系统提示词、API 或模型。长度控制在 80-200 字。'
    ].join('\n');
    const content = [
      `[用户日记]`,
      `标题：${entry.title}`,
      `日期：${entry.dateKey}`,
      '',
      entry.content
    ].join('\n');
    const review = await callClaude(
      { ...role, systemPrompt, skipSystemPromptMerge: true },
      [{ role: 'user', content }]
    );
    await diaryService.update(entry.id, {
      ...entry,
      aiReview: String(review || '').trim(),
      aiReviewRoleId: targetRoleId,
      aiReviewedAt: Date.now()
    });
    await loadData();
  } catch (error) {
    alert(`评价失败：${error.message}`);
  } finally {
    reviewingId.value = null;
  }
}

async function generateRoleDiary() {
  if (!generateForm.value.roleId) {
    alert('请选择角色');
    return;
  }

  const startAt = new Date(generateForm.value.start).getTime();
  const endAt = new Date(generateForm.value.end).getTime();
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || startAt >= endAt) {
    alert('请选择有效的时间段');
    return;
  }

  try {
    isGeneratingDiary.value = true;
    const role = await resolveRoleWithApi(generateForm.value.roleId);
    const messages = await messageService.getByRoleTimeRange(role.id, startAt, endAt);
    if (messages.length === 0) {
      alert('这个时间段没有可记录的聊天');
      return;
    }

    const startText = new Date(startAt).toLocaleString();
    const endText = new Date(endAt).toLocaleString();
    const systemPrompt = [
      `请以角色“${role.name || '角色'}”的第一人称写一篇私人日记。`,
      `这篇日记记录的是 ${startText} 到 ${endText} 之间你和用户的互动。`,
      '可以记录发生了什么、你在意的细节、你的情绪、你对关系的理解，以及以后希望记住的事。',
      '不要写成聊天总结，不要逐条复述消息，不要提及“根据聊天记录”或“系统让我写日记”。',
      '输出严格 JSON：{"title":"标题","content":"日记正文"}'
    ].join('\n');

    const response = await callClaude(
      { ...role, systemPrompt, skipSystemPromptMerge: true },
      [{ role: 'user', content: `[时间段聊天内容]\n${formatTranscript(messages)}` }]
    );
    const dateKey = toDateKey(new Date(endAt));
    const parsed = parseDiaryResponse(response, dateKey);
    if (!parsed.content) throw new Error('模型没有生成有效正文');

    await diaryService.create({
      authorType: 'role',
      roleId: role.id,
      linkedRoleIds: [role.id],
      dateKey,
      title: parsed.title,
      content: parsed.content,
      visibility: 'role_visible',
      includeInContext: !!generateForm.value.includeInContext,
      startAt,
      endAt,
      source: 'button'
    });
    selectedRoleId.value = role.id;
    currentTab.value = 'roles';
    showGenerateDrawer.value = false;
    await loadData();
  } catch (error) {
    alert(`生成失败：${error.message}`);
  } finally {
    isGeneratingDiary.value = false;
  }
}

function openEditor(dateKey, entry = null) {
  editingId.value = entry?.id || null;
  if (entry) {
    form.value = {
      dateKey: entry.dateKey,
      title: entry.title || '',
      content: entry.content || '',
      moodId: entry.moodId || moodMap.value[entry.dateKey]?.moodId || '',
      roleVisible: entry.visibility === 'role_visible',
      includeInContext: !!entry.includeInContext,
      linkedRoleIds: [...(entry.linkedRoleIds || [])]
    };
  } else {
    form.value = {
      ...makeEmptyForm(dateKey),
      moodId: moodMap.value[dateKey]?.moodId || ''
    };
  }
  showDayDrawer.value = false;
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
}

function toggleRole(roleId) {
  const set = new Set(form.value.linkedRoleIds);
  if (set.has(roleId)) set.delete(roleId);
  else set.add(roleId);
  form.value.linkedRoleIds = [...set];
}

async function saveEntry() {
  try {
    if (!form.value.content.trim()) {
      alert('请先写一点内容');
      return;
    }
    if (form.value.roleVisible && form.value.linkedRoleIds.length === 0) {
      alert('请选择至少一个可见角色');
      return;
    }

    if (form.value.moodId) {
      await dailyMoodService.set(form.value.dateKey, form.value.moodId);
    }

    const payload = {
      authorType: 'user',
      dateKey: form.value.dateKey,
      title: form.value.title || `${formatDateLabel(form.value.dateKey)}的日记`,
      content: form.value.content,
      moodId: form.value.moodId,
      visibility: form.value.roleVisible ? 'role_visible' : 'private',
      includeInContext: form.value.roleVisible && form.value.includeInContext,
      linkedRoleIds: form.value.roleVisible ? form.value.linkedRoleIds : []
    };

    if (editingId.value) {
      await diaryService.update(editingId.value, payload);
    } else {
      await diaryService.create(payload);
    }

    selectedDateKey.value = form.value.dateKey;
    selectedMonth.value = new Date(parseDateKey(form.value.dateKey).getFullYear(), parseDateKey(form.value.dateKey).getMonth(), 1);
    await loadData();
    closeEditor();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteEntry() {
  if (!editingId.value || !confirm('确定删除这篇日记吗？')) return;
  await diaryService.delete(editingId.value);
  await loadData();
  closeEditor();
}

const handleThemeChange = (event) => {
  currentTheme.value = event.detail?.systemTheme || localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
};

watch(monthKey, loadData);

onMounted(() => {
  loadData();
  window.addEventListener('xiaoshouji-theme-change', handleThemeChange);
});

onUnmounted(() => {
  window.removeEventListener('xiaoshouji-theme-change', handleThemeChange);
});
</script>

<style scoped>
.diary-page {
  --sys-bg: #f5f4ed;
  --card-bg: #faf9f5;
  --text-main: #5c504d;
  --text-sub: #9e938f;
  --accent: #d97757;
  --soft-bg: rgba(0, 0, 0, 0.045);
  --accent-soft: rgba(217, 119, 87, 0.12);
  --card-border: rgba(255, 255, 255, 0.72);
  --shadow: rgba(217, 119, 87, 0.08);
  --overlay-bg: rgba(0, 0, 0, 0.3);
  --danger: #ff3b30;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--sys-bg);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}

.diary-page.theme-nordic {
  --sys-bg: #f0f4f8;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-sub: #7f8c8d;
  --accent: #6b8ea5;
  --soft-bg: rgba(107, 142, 165, 0.1);
  --accent-soft: rgba(107, 142, 165, 0.14);
  --card-border: rgba(107, 142, 165, 0.16);
  --shadow: rgba(107, 142, 165, 0.08);
}

.diary-page.theme-data {
  --sys-bg: #1e2024;
  --card-bg: #2a2d34;
  --text-main: #e0e6ed;
  --text-sub: #8892b0;
  --accent: #40d1af;
  --soft-bg: rgba(255, 255, 255, 0.06);
  --accent-soft: rgba(64, 209, 175, 0.12);
  --card-border: rgba(255, 255, 255, 0.08);
  --shadow: rgba(0, 0, 0, 0.28);
  --overlay-bg: rgba(0, 0, 0, 0.52);
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: env(safe-area-inset-top) 18px 8px;
  min-height: 56px;
  flex-shrink: 0;
}

.nav-btn {
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  color: var(--accent);
  display: grid;
  place-items: center;
}

.nav-btn svg { width: 24px; height: 24px; }
.nav-title { font-size: 18px; font-weight: 800; letter-spacing: 1px; }

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 0 20px 14px;
  padding: 4px;
  background: var(--soft-bg);
  border-radius: 18px;
}

.segmented button {
  border: 0;
  border-radius: 14px;
  padding: 10px;
  background: transparent;
  color: var(--text-sub);
  font-size: 14px;
  font-weight: 800;
}

.segmented button.active {
  background: var(--card-bg);
  color: var(--text-main);
  box-shadow: 0 6px 18px var(--shadow);
}

.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 20px 36px;
}

.content::-webkit-scrollbar { display: none; }

.month-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 26px;
  padding: 16px;
  box-shadow: 0 8px 24px var(--shadow);
}

.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.month-title {
  text-align: center;
  font-size: 20px;
  font-weight: 900;
}

.month-sub {
  margin-top: 4px;
  text-align: center;
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 700;
}

.month-btn {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  background: var(--soft-bg);
  color: var(--accent);
}

.month-btn svg { width: 20px; height: 20px; }

.week-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.week-row {
  margin-bottom: 8px;
  color: var(--text-sub);
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.day-cell {
  position: relative;
  aspect-ratio: 1 / 1.1;
  min-width: 0;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.day-cell:active { transform: scale(0.96); }
.day-cell.muted { opacity: 0.32; }
.day-cell.today { outline: 2px solid var(--accent-soft); }
.day-cell.selected { background: var(--accent-soft); }

.day-num {
  position: absolute;
  top: 6px;
  left: 7px;
  z-index: 2;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.46;
}

.day-mood {
  width: min(68%, 34px);
  height: min(68%, 34px);
  color: var(--mood);
  display: grid;
  place-items: center;
  margin-top: 4px;
}

.day-mood .mood-svg {
  width: 100%;
  height: 100%;
}

.diary-mark {
  position: absolute;
  left: 50%;
  bottom: 7px;
  width: 18px;
  height: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 72%, transparent);
  opacity: 0.78;
}

.mood-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.mood-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--card-bg);
  color: var(--mood);
  font-size: 12px;
  font-weight: 800;
}

.mood-summary .mood-svg { width: 18px; height: 18px; }

.role-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
}

.role-filter::-webkit-scrollbar { display: none; }

.role-filter button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--card-bg);
  color: var(--text-sub);
  font-weight: 800;
}

.role-filter button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.role-filter img {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  object-fit: cover;
}

.generate-role-btn {
  width: 100%;
  margin-bottom: 14px;
  border: 0;
  border-radius: 18px;
  padding: 13px;
  background: var(--accent);
  color: white;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 8px 20px var(--shadow);
}

.diary-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 22px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px var(--shadow);
}

.diary-card.small {
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: none;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 800;
}

.diary-card h3 {
  margin: 8px 0 7px;
  color: var(--text-main);
  font-size: 17px;
  line-height: 1.3;
}

.diary-card p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-box {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.55;
}

.inline-action {
  margin-top: 10px;
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  background: var(--soft-bg);
  color: var(--accent);
  font-size: 12px;
  font-weight: 900;
}

.inline-action:disabled,
.save-btn:disabled {
  opacity: 0.58;
}

.empty-state,
.day-empty {
  margin-top: 56px;
  text-align: center;
  color: var(--text-sub);
}

.empty-title {
  margin-bottom: 8px;
  color: var(--text-main);
  font-weight: 900;
}

.empty-sub,
.day-empty {
  font-size: 13px;
  line-height: 1.6;
}

.drawer-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
}

.drawer-content {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  background: var(--sys-bg);
  border-radius: 30px 30px 0 0;
  padding: 14px 22px calc(18px + env(safe-area-inset-bottom));
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.12);
}

.drawer-content.editor {
  display: flex;
  flex-direction: column;
}

.drawer-handle {
  width: 42px;
  height: 5px;
  margin: 0 auto 18px;
  border-radius: 3px;
  background: var(--soft-bg);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.drawer-header h3 {
  margin: 0;
  font-size: 20px;
}

.drawer-header p {
  margin: 5px 0 0;
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 700;
}

.text-btn,
.delete-btn {
  border: 0;
  background: transparent;
  color: var(--accent);
  font-size: 15px;
  font-weight: 900;
}

.delete-btn { color: var(--danger); }

.mood-picker,
.editor-moods {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.mood-picker button,
.editor-moods button {
  min-width: 0;
  border: 0;
  border-radius: 16px;
  padding: 10px 6px;
  background: var(--card-bg);
  color: var(--mood);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 900;
}

.mood-picker button.active,
.editor-moods button.active {
  background: color-mix(in srgb, var(--mood) 18%, var(--card-bg));
  outline: 2px solid color-mix(in srgb, var(--mood) 42%, transparent);
}

.mood-svg {
  width: 24px;
  height: 24px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 12px;
}

.field-row label,
.panel-title {
  color: var(--text-main);
  font-size: 14px;
  font-weight: 900;
}

.field-row input,
.field-row select,
.diary-textarea {
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: var(--card-bg);
  color: var(--text-main);
  padding: 14px;
  outline: none;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
}

.diary-textarea {
  min-height: 170px;
  resize: none;
  line-height: 1.7;
  margin-bottom: 14px;
}

.option-panel,
.role-select-panel {
  overflow: hidden;
  margin-bottom: 14px;
  border-radius: 18px;
  background: var(--card-bg);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--soft-bg);
  color: var(--text-main);
  font-weight: 800;
}

.switch-row.standalone {
  margin-bottom: 14px;
  border-radius: 18px;
  background: var(--card-bg);
  border-bottom: 0;
}

.switch-row:last-child { border-bottom: 0; }

.wx-switch {
  position: relative;
  width: 44px;
  height: 26px;
  appearance: none;
  background-color: var(--soft-bg);
  border-radius: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.25s;
  margin: 0;
  flex-shrink: 0;
}

.wx-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s;
}

.wx-switch:checked { background: var(--accent); }
.wx-switch:checked::after { transform: translateX(18px); }

.role-select-panel {
  padding: 14px;
}

.role-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.role-checks button {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  max-width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 7px 10px;
  background: var(--soft-bg);
  color: var(--text-sub);
  font-weight: 800;
}

.role-checks button.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.role-checks img {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  object-fit: cover;
}

.save-btn {
  width: 100%;
  border: 0;
  border-radius: 20px;
  background: var(--accent);
  color: white;
  padding: 16px;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 8px 20px var(--shadow);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
