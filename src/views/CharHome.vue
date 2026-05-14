<template>
  <div class="char-page" :class="currentTheme">
    <header class="char-header">
      <div>
        <h1>角色</h1>
        <p>与他们的故事在继续</p>
      </div>
      <div class="view-switch">
        <button :class="{ active: viewMode === 'cards' }" aria-label="卡片视图" @click="setViewMode('cards')">
          <i class="ph ph-squares-four"></i>
        </button>
        <button :class="{ active: viewMode === 'list' }" aria-label="列表视图" @click="setViewMode('list')">
          <i class="ph ph-list-bullets"></i>
        </button>
      </div>
    </header>

    <main v-if="roles.length" class="char-home" :class="{ 'list-mode': viewMode === 'list' }">
      <template v-if="viewMode === 'cards'">
        <section ref="cardRail" class="role-card-rail" @scroll.passive="onCardScroll">
          <article
            v-for="(role, index) in roles"
            :key="role.id"
            class="role-card"
            :class="{ active: index === activeCardIndex, nearby: Math.abs(index - activeCardIndex) === 1 }"
            @click="openDetail(role.id)"
          >
            <div class="role-card-media" :style="coverStyle(role)">
              <div class="role-card-shade"></div>
              <div class="role-card-copy">
                <h2>{{ role.name || '未命名角色' }}</h2>
                <p>{{ roleSummary(role, 72) }}</p>
              </div>
            </div>
          </article>
        </section>

        <div v-if="roles.length > 1" class="role-dots" aria-label="角色卡片分页">
          <button
            v-for="(role, index) in roles"
            :key="`dot-${role.id}`"
            :class="{ active: index === activeCardIndex }"
            :aria-label="`第 ${index + 1} 张角色卡`"
            @click="scrollToCard(index)"
          ></button>
        </div>
      </template>

      <section v-else class="role-list">
        <button v-for="role in roles" :key="role.id" class="role-list-item" @click="openDetail(role.id)">
          <img class="role-list-avatar" :src="role.avatar || defaultAvatar" alt="" />
          <span>
            <strong>{{ role.name || '未命名角色' }}</strong>
            <small>{{ roleSummary(role, 48) }}</small>
          </span>
          <i class="ph ph-caret-right"></i>
        </button>
      </section>
    </main>

    <main v-else class="empty-state">
      <i class="ph ph-identification-card"></i>
      <h2>还没有角色</h2>
      <p>先创建一个角色，再来这里整理档案、记忆和关系。</p>
      <button @click="router.push('/contacts/new')">新建角色</button>
    </main>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { roleService } from '../services/db';
import { coverStyle, defaultAvatar, roleSummary } from '../composables/useCharProfile';
import { useSystemTheme } from '../composables/useSystemTheme';

const router = useRouter();
const { currentTheme } = useSystemTheme();

const roles = ref([]);
const viewMode = ref(localStorage.getItem('charViewMode') || 'cards');
const activeCardIndex = ref(0);
const cardRail = ref(null);

onMounted(async () => {
  await loadRoles();
});

const loadRoles = async () => {
  const allRoles = await roleService.getAll();
  roles.value = allRoles;
  activeCardIndex.value = Math.min(activeCardIndex.value, Math.max(0, allRoles.length - 1));
  await nextTick();
  scrollToCard(activeCardIndex.value, 'auto');
};

const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('charViewMode', mode);
  if (mode === 'cards') {
    nextTick(() => scrollToCard(activeCardIndex.value, 'auto'));
  }
};

const onCardScroll = () => {
  const rail = cardRail.value;
  if (!rail) return;
  const railCenter = rail.scrollLeft + rail.clientWidth / 2;
  let closestIndex = 0;
  let closestDistance = Infinity;

  Array.from(rail.children).forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - railCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  activeCardIndex.value = closestIndex;
};

const scrollToCard = (index, behavior = 'smooth') => {
  const rail = cardRail.value;
  const card = rail?.children?.[index];
  if (!rail || !card) return;
  const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;
  rail.scrollTo({ left, behavior });
  activeCardIndex.value = index;
};

const openDetail = (id) => {
  router.replace(`/char/${id}`);
};
</script>

<style scoped>
.char-page {
  --char-bg-start: #faf6ef;
  --char-bg-mid: #f1ebe2;
  --char-bg-end: #f7f3ed;
  --char-surface: rgba(255, 255, 255, 0.72);
  --char-surface-solid: #fff8ef;
  --char-surface-muted: #d8d0c6;
  --char-text: #2f2925;
  --char-text-strong: #171310;
  --char-text-soft: rgba(47, 41, 37, 0.58);
  --char-text-faint: rgba(47, 41, 37, 0.28);
  --char-accent: #c68b57;
  --char-accent-text: #8c623f;
  --char-accent-soft: rgba(199, 139, 86, 0.12);
  --char-border: rgba(76, 58, 44, 0.1);
  --char-shadow: rgba(58, 43, 32, 0.08);
  --char-deep-shadow: rgba(35, 26, 20, 0.16);
  --char-fade-rgb: 247, 243, 237;
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
.char-page.theme-nordic {
  --char-bg-start: #f7fbff;
  --char-bg-mid: #edf4fa;
  --char-bg-end: #f4f8fb;
  --char-surface: rgba(255, 255, 255, 0.76);
  --char-surface-solid: #f8fbff;
  --char-surface-muted: #dce7ef;
  --char-text: #2c3e50;
  --char-text-strong: #1d2e3d;
  --char-text-soft: rgba(44, 62, 80, 0.58);
  --char-text-faint: rgba(44, 62, 80, 0.28);
  --char-accent: #6b8ea5;
  --char-accent-text: #4f748d;
  --char-accent-soft: rgba(107, 142, 165, 0.13);
  --char-border: rgba(107, 142, 165, 0.16);
  --char-shadow: rgba(107, 142, 165, 0.08);
  --char-deep-shadow: rgba(44, 62, 80, 0.16);
  --char-fade-rgb: 244, 248, 251;
}
.char-page.theme-data {
  --char-bg-start: #25282e;
  --char-bg-mid: #1e2024;
  --char-bg-end: #202329;
  --char-surface: rgba(42, 45, 52, 0.76);
  --char-surface-solid: #2a2d34;
  --char-surface-muted: #353942;
  --char-text: #e0e6ed;
  --char-text-strong: #f5f8fb;
  --char-text-soft: rgba(224, 230, 237, 0.62);
  --char-text-faint: rgba(224, 230, 237, 0.32);
  --char-accent: #40d1af;
  --char-accent-text: #6be1c5;
  --char-accent-soft: rgba(64, 209, 175, 0.13);
  --char-border: rgba(255, 255, 255, 0.08);
  --char-shadow: rgba(0, 0, 0, 0.28);
  --char-deep-shadow: rgba(0, 0, 0, 0.36);
  --char-fade-rgb: 32, 35, 41;
}
.char-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: calc(28px + env(safe-area-inset-top)) 24px 14px;
}
.char-header h1 {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 800;
}
.char-header p {
  margin: 9px 0 0;
  color: var(--char-text-soft);
  font-size: 13px;
}
.view-switch {
  display: flex;
  gap: 9px;
}
.view-switch button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  color: var(--char-text);
  background: var(--char-surface);
  box-shadow: 0 8px 20px var(--char-shadow);
}
.view-switch button.active {
  color: var(--char-bg-end);
  background: var(--char-text-strong);
}
.char-home {
  position: relative;
  min-height: calc(100dvh - 116px - env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 48px;
}
.char-home.list-mode {
  justify-content: flex-start;
  padding-top: 10px;
}
.char-home::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  height: 96px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(var(--char-fade-rgb), 0) 0%, rgba(var(--char-fade-rgb), 0.76) 72%, rgb(var(--char-fade-rgb)) 100%);
}
.role-card-rail {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 18px 12vw 76px;
  scrollbar-width: none;
}
.role-card-rail::-webkit-scrollbar {
  display: none;
}
.role-card {
  position: relative;
  z-index: 1;
  flex: 0 0 min(76vw, 330px);
  height: min(64vh, 540px);
  min-height: 450px;
  border-radius: 32px;
  overflow: hidden;
  background: var(--char-surface-muted);
  scroll-snap-align: center;
  opacity: 0.62;
  filter: saturate(0.78) brightness(0.82);
  transform: scale(0.9);
  transform-origin: center bottom;
  transition: transform 0.24s ease, opacity 0.24s ease, filter 0.24s ease, box-shadow 0.24s ease;
  box-shadow: 0 18px 30px var(--char-shadow);
}
.role-card.nearby {
  z-index: 2;
  opacity: 0.76;
  filter: saturate(0.88) brightness(0.88);
  transform: scale(0.94);
}
.role-card.active {
  z-index: 3;
  opacity: 1;
  filter: none;
  transform: scale(1);
  box-shadow:
    0 14px 24px var(--char-deep-shadow),
    0 26px 34px -22px var(--char-deep-shadow);
}
.role-card + .role-card {
  margin-left: -2px;
}
.role-card-media {
  position: relative;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(75, 60, 48, 0.2), rgba(255, 255, 255, 0.36)),
    var(--char-surface-muted);
  background-size: cover;
  background-position: center;
}
.role-card-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 28%, rgba(0, 0, 0, 0.64) 100%);
}
.role-card-copy {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 28px;
  color: #fff;
}
.role-card-copy h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}
.role-card-copy p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 14px;
  line-height: 1.55;
}
.role-dots {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-top: -54px;
}
.role-dots button {
  width: 6px;
  height: 6px;
  border: none;
  border-radius: 999px;
  padding: 0;
  background: var(--char-text-faint);
  transition: width 0.2s ease, background 0.2s ease;
}
.role-dots button.active {
  width: 7px;
  background: var(--char-text-strong);
}
.role-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 32px;
}
.role-list-item {
  display: grid;
  grid-template-columns: 78px 1fr 22px;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--char-border);
  border-radius: 18px;
  padding: 11px;
  background: var(--char-surface);
  text-align: left;
}
.role-list-avatar {
  width: 78px;
  height: 78px;
  border-radius: 14px;
  object-fit: cover;
}
.role-list-item strong,
.role-list-item small {
  display: block;
}
.role-list-item strong {
  margin-bottom: 7px;
  color: var(--char-text);
  font-size: 17px;
}
.role-list-item small {
  color: var(--char-text-soft);
  font-size: 13px;
  line-height: 1.5;
}
.empty-state {
  display: grid;
  place-items: center;
  min-height: 58vh;
  padding: 30px;
  text-align: center;
}
.empty-state i {
  color: var(--char-text-faint);
  font-size: 54px;
}
.empty-state h2 {
  margin: 16px 0 6px;
}
.empty-state p {
  color: var(--char-text-soft);
  line-height: 1.6;
}
.empty-state button {
  margin-top: 12px;
  border: none;
  border-radius: 999px;
  padding: 12px 22px;
  color: var(--char-text);
  background: var(--char-surface-solid);
  font-weight: 700;
}

@media (max-width: 360px) {
  .role-card {
    flex-basis: 78vw;
    min-height: 430px;
  }
  .role-card-rail {
    padding-left: 11vw;
    padding-right: 11vw;
  }
}
</style>
