<template>
  <div class="char-detail-page" :class="currentTheme">
    <template v-if="selectedRole">
      <char-home-dashboard
        v-if="currentSection === 'home'"
        :archive-text="archiveText"
        :memory-count="memoryCount"
        :profile="profile"
        :relation-nodes="relationNodes"
        :role="selectedRole"
        :role-diaries="roleDiaries"
        :world-entries="matchedWorldEntries"
        @back="goHome"
        @settings="openSettings"
        @open-section="openSection"
      />

      <char-sub-page-shell
        v-else
        :role="selectedRole"
        :title="sectionCopy.title"
        @back="goRoleHome"
      >
        <char-archive-panel
          v-if="currentSection === 'archive'"
          :archive-text="archiveText"
          :profile="profile"
          :role="selectedRole"
          :visible-tags="visibleTags"
          @save-profile="saveProfile"
        />
        <char-world-panel
          v-else-if="currentSection === 'world'"
          :entries="matchedWorldEntries"
        />
        <char-memory-panel
          v-else-if="currentSection === 'memory'"
          :core-memory="coreMemory"
          :current-memory-audio-id="currentMemoryAudioId"
          :favorite-messages="favoriteMessages"
          :heart-voice-fields-for="heartVoiceFieldsFor"
          :long-term-memory="longTermMemory"
          :message-memory-text="messageMemoryText"
          :role="selectedRole"
          :role-diaries="roleDiaries"
          :saved-heart-voices="savedHeartVoices"
          @toggle-audio="toggleMemoryAudio"
        />
        <char-relations-panel
          v-else
          :relation-nodes="relationNodes"
          :role="selectedRole"
        />
      </char-sub-page-shell>
    </template>

    <main v-else class="empty-state">
      <h2>{{ loading ? '正在加载角色' : '角色不存在' }}</h2>
      <button v-if="!loading" @click="goHome">返回角色中心</button>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CharArchivePanel from '../components/char/CharArchivePanel.vue';
import CharHomeDashboard from '../components/char/CharHomeDashboard.vue';
import CharMemoryPanel from '../components/char/CharMemoryPanel.vue';
import CharRelationsPanel from '../components/char/CharRelationsPanel.vue';
import CharSubPageShell from '../components/char/CharSubPageShell.vue';
import CharWorldPanel from '../components/char/CharWorldPanel.vue';
import { useCharDetailData } from '../composables/useCharDetailData';
import { useSystemTheme } from '../composables/useSystemTheme';
import { conversationService } from '../services/db';

const route = useRoute();
const router = useRouter();
const { currentTheme } = useSystemTheme();

const routeRoleId = computed(() => route.params.id);
const {
  archiveText,
  coreMemory,
  currentMemoryAudioId,
  favoriteMessages,
  heartVoiceFieldsFor,
  loading,
  longTermMemory,
  matchedWorldEntries,
  memoryCount,
  messageMemoryText,
  profile,
  relationNodes,
  roleDiaries,
  savedHeartVoices,
  saveProfile,
  selectedRole,
  toggleMemoryAudio,
  visibleTags
} = useCharDetailData(routeRoleId);

const sectionByRouteName = {
  CharArchive: 'archive',
  CharWorld: 'world',
  CharMemory: 'memory',
  CharRelations: 'relations'
};

const sectionMeta = {
  home: {
    title: '角色首页',
    description: ''
  },
  archive: {
    title: '档案',
    description: '人设、标签、立绘和图片都放在这里。'
  },
  world: {
    title: '世界书',
    description: '查看与这个角色相关的世界设定条目。'
  },
  memory: {
    title: '记忆空间',
    description: '心声、收藏、日记和长期记忆，像一盒随手留下的小纸条。'
  },
  relations: {
    title: '关系网',
    description: '查看角色和重要人物之间的连接。'
  }
};

const currentSection = computed(() => sectionByRouteName[route.name] || 'home');
const sectionCopy = computed(() => sectionMeta[currentSection.value] || sectionMeta.home);

const goHome = () => {
  router.replace('/char');
};

const goRoleHome = () => {
  if (!selectedRole.value?.id) return;
  router.replace(`/char/${selectedRole.value.id}`);
};

const openSection = (section) => {
  if (!selectedRole.value?.id) return;
  router.push(`/char/${selectedRole.value.id}/${section}`);
};

const openSettings = async () => {
  if (!selectedRole.value?.id) return;
  const conversation = await conversationService.getOrCreate(selectedRole.value.id);
  router.replace(`/chat-details/conv/${conversation.id}`);
};
</script>

<style scoped>
.char-detail-page {
  --char-bg-start: #faf6ef;
  --char-bg-mid: #f1ebe2;
  --char-bg-end: #f7f3ed;
  --char-body-start: #f9f5ef;
  --char-body-end: #f1ebe3;
  --char-surface: rgba(255, 255, 255, 0.72);
  --char-surface-soft: rgba(255, 255, 255, 0.62);
  --char-surface-muted: #ddd4c9;
  --char-text: #2f2925;
  --char-text-strong: #171310;
  --char-text-soft: rgba(47, 41, 37, 0.58);
  --char-text-muted: rgba(47, 41, 37, 0.42);
  --char-accent: #c68b57;
  --char-accent-text: #8c623f;
  --char-accent-soft: rgba(199, 139, 86, 0.12);
  --char-border: rgba(76, 58, 44, 0.1);
  --char-border-soft: rgba(76, 58, 44, 0.08);
  --char-border-dashed: rgba(76, 58, 44, 0.16);
  --char-shadow: rgba(58, 43, 32, 0.08);
  --char-deep-shadow: rgba(58, 43, 32, 0.18);
  --char-note-bg: #fff7da;
  --char-note-text: #3b3028;
  --char-note-muted: rgba(59, 48, 40, 0.54);

  height: var(--vvh, 100dvh);
  color: var(--char-text);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 36%),
    linear-gradient(180deg, var(--char-bg-start) 0%, var(--char-bg-mid) 55%, var(--char-bg-end) 100%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.char-detail-page.theme-nordic {
  --char-bg-start: #f7fbff;
  --char-bg-mid: #edf4fa;
  --char-bg-end: #f4f8fb;
  --char-body-start: #f8fbff;
  --char-body-end: #edf4fa;
  --char-surface: rgba(255, 255, 255, 0.76);
  --char-surface-soft: rgba(255, 255, 255, 0.68);
  --char-surface-muted: #dce7ef;
  --char-text: #2c3e50;
  --char-text-strong: #1d2e3d;
  --char-text-soft: rgba(44, 62, 80, 0.58);
  --char-text-muted: rgba(44, 62, 80, 0.42);
  --char-accent: #6b8ea5;
  --char-accent-text: #4f748d;
  --char-accent-soft: rgba(107, 142, 165, 0.13);
  --char-border: rgba(107, 142, 165, 0.16);
  --char-border-soft: rgba(107, 142, 165, 0.12);
  --char-border-dashed: rgba(107, 142, 165, 0.22);
  --char-shadow: rgba(107, 142, 165, 0.08);
  --char-deep-shadow: rgba(44, 62, 80, 0.18);
  --char-note-bg: #fffaf0;
  --char-note-text: #32404a;
  --char-note-muted: rgba(50, 64, 74, 0.52);
}

.char-detail-page.theme-data {
  --char-bg-start: #25282e;
  --char-bg-mid: #1e2024;
  --char-bg-end: #202329;
  --char-body-start: #25282e;
  --char-body-end: #1e2024;
  --char-surface: rgba(42, 45, 52, 0.76);
  --char-surface-soft: rgba(42, 45, 52, 0.68);
  --char-surface-muted: #353942;
  --char-text: #e0e6ed;
  --char-text-strong: #f5f8fb;
  --char-text-soft: rgba(224, 230, 237, 0.62);
  --char-text-muted: rgba(224, 230, 237, 0.42);
  --char-accent: #40d1af;
  --char-accent-text: #6be1c5;
  --char-accent-soft: rgba(64, 209, 175, 0.13);
  --char-border: rgba(255, 255, 255, 0.08);
  --char-border-soft: rgba(255, 255, 255, 0.08);
  --char-border-dashed: rgba(255, 255, 255, 0.14);
  --char-shadow: rgba(0, 0, 0, 0.28);
  --char-deep-shadow: rgba(0, 0, 0, 0.36);
  --char-note-bg: #3b342d;
  --char-note-text: #ebe2d3;
  --char-note-muted: rgba(235, 226, 211, 0.58);
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 58vh;
  padding: 30px;
  text-align: center;
}

.empty-state h2 {
  margin: 16px 0 6px;
}

.empty-state button {
  margin-top: 12px;
  border: 0;
  border-radius: 999px;
  padding: 12px 22px;
  color: var(--char-text);
  background: var(--char-surface);
  font-weight: 800;
}
</style>
