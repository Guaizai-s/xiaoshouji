<template>
  <div class="memory-panel">
    <article class="memory-draw-card">
      <div>
        <span>Memory Draw</span>
        <h2>抽一张记忆</h2>
        <p>以后会从日记、长期记忆和手写记忆里随机抽取一段，像翻到一张随手夹进手账的小纸条。</p>
      </div>
      <button disabled>即将开放</button>
    </article>

    <section class="memory-board">
      <div class="section-heading">
        <h2>保存的心声</h2>
        <small>{{ savedHeartVoices.length }} 张</small>
      </div>
      <div v-if="savedHeartVoices.length" class="note-grid">
        <article
          v-for="(item, index) in savedHeartVoices"
          :key="item.id"
          class="note-card heart-note"
          :class="noteTilt(index)"
        >
          <span class="tape"></span>
          <div class="note-head">
            <strong>{{ item.title || '心声' }}</strong>
            <time>{{ formatDate(item.createdAt) }}</time>
          </div>
          <p v-if="item.content">{{ item.content }}</p>
          <div class="heart-fields">
            <p v-for="field in heartVoiceFieldsFor(item)" :key="`${item.id}-${field.key}`">
              <span>{{ field.label }}</span>{{ field.value }}
            </p>
          </div>
        </article>
      </div>
      <div v-else class="soft-empty">还没有保存的心声。聊天里的心声面板点保存后会来到这里。</div>
    </section>

    <section class="memory-board">
      <div class="section-heading">
        <h2>长期记忆</h2>
        <small>{{ longTermMemory ? '1 张' : '0 张' }}</small>
      </div>
      <article v-if="longTermMemory" class="note-card long-note">
        <span class="tape"></span>
        <div class="note-head">
          <strong>长期记忆总览</strong>
          <time>长期</time>
        </div>
        <p>{{ longTermMemory }}</p>
        <small class="future-hint">以后会拆成像 GPT 记忆一样的一条条记录，可带总结、关键词和来源。</small>
      </article>
      <div v-else class="soft-empty">还没有长期记忆。这里先保留未来的逐条记忆入口。</div>
    </section>

    <section class="memory-board">
      <div class="section-heading">
        <h2>核心记忆</h2>
        <small>{{ coreMemory ? '1 张' : '0 张' }}</small>
      </div>
      <article v-if="coreMemory" class="note-card core-note">
        <span class="tape"></span>
        <div class="note-head">
          <strong>核心记忆</strong>
          <time>核心</time>
        </div>
        <p>{{ coreMemory }}</p>
      </article>
      <div v-else class="soft-empty">还没有写入核心记忆。</div>
    </section>

    <section class="memory-board">
      <div class="section-heading">
        <h2>角色日记</h2>
        <small>{{ roleDiaries.length }} 篇</small>
      </div>
      <div v-if="roleDiaries.length" class="note-grid">
        <article
          v-for="(diary, index) in roleDiaries.slice(0, 8)"
          :key="diary.id"
          class="note-card diary-note"
          :class="noteTilt(index + 1)"
        >
          <span class="tape"></span>
          <div class="note-head">
            <strong>{{ diary.title }}</strong>
            <time>{{ diary.dateKey || formatDate(diary.createdAt) }}</time>
          </div>
          <p>{{ clip(diary.summary || diary.content, 180) }}</p>
        </article>
      </div>
      <div v-else class="soft-empty">还没有角色日记。未来抽取记忆时，这里会是来源之一。</div>
    </section>

    <section class="memory-board">
      <div class="section-heading">
        <h2>收藏的聊天</h2>
        <small>{{ favoriteMessages.length }} 条</small>
      </div>
      <div v-if="favoriteMessages.length" class="note-grid">
        <article
          v-for="(msg, index) in favoriteMessages"
          :key="msg.id"
          class="note-card favorite-note"
          :class="noteTilt(index + 2)"
        >
          <span class="tape"></span>
          <div class="note-head">
            <strong>{{ msg.role === 'user' ? '你' : role.name }}</strong>
            <time>{{ formatDate(msg.favoriteAt || msg.timestamp) }}</time>
          </div>
          <button
            v-if="msg.audioUrl"
            class="memory-audio-btn"
            :class="{ playing: currentMemoryAudioId === msg.id }"
            @click="$emit('toggle-audio', msg)"
          >
            <i :class="currentMemoryAudioId === msg.id ? 'ph-fill ph-pause-circle' : 'ph-fill ph-play-circle'"></i>
            <span>{{ currentMemoryAudioId === msg.id ? '正在播放' : '播放语音' }}</span>
          </button>
          <p>{{ messageMemoryText(msg) }}</p>
        </article>
      </div>
      <div v-else class="soft-empty">长按聊天或语音消息收藏后，会自动出现在这里。</div>
    </section>
  </div>
</template>

<script setup>
import { clip, formatDate } from '../../composables/useCharProfile';

defineProps({
  coreMemory: { type: String, default: '' },
  currentMemoryAudioId: { type: [Number, String, null], default: null },
  favoriteMessages: { type: Array, default: () => [] },
  heartVoiceFieldsFor: { type: Function, required: true },
  longTermMemory: { type: String, default: '' },
  messageMemoryText: { type: Function, required: true },
  role: { type: Object, required: true },
  roleDiaries: { type: Array, default: () => [] },
  savedHeartVoices: { type: Array, default: () => [] }
});

defineEmits(['toggle-audio']);

const noteTilt = (index) => `tilt-${index % 4}`;
</script>

<style scoped>
.memory-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.memory-draw-card {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  overflow: hidden;
  border: 1px solid var(--char-border-soft);
  border-radius: 22px;
  padding: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.38), transparent 54%),
    var(--char-accent-soft);
  box-shadow: 0 14px 28px var(--char-shadow);
}

.memory-draw-card::before {
  content: '';
  position: absolute;
  left: 22px;
  top: -10px;
  width: 86px;
  height: 24px;
  border-radius: 4px;
  background: rgba(255, 244, 190, 0.62);
  transform: rotate(-5deg);
}

.memory-draw-card span {
  color: var(--char-accent-text);
  font-size: 12px;
  font-weight: 900;
}

.memory-draw-card h2 {
  margin: 7px 0 8px;
  color: var(--char-text-strong);
  font-size: 22px;
}

.memory-draw-card p {
  margin: 0;
  color: var(--char-text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.memory-draw-card button {
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  padding: 9px 12px;
  color: var(--char-text-muted);
  background: var(--char-surface);
  font-weight: 800;
}

.memory-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2 {
  margin: 0;
  color: var(--char-text-strong);
  font-size: 18px;
}

.section-heading small {
  color: var(--char-text-muted);
}

.note-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 13px;
}

.note-card {
  position: relative;
  border: 1px solid rgba(126, 98, 69, 0.12);
  border-radius: 10px;
  padding: 18px 16px 16px;
  color: var(--char-note-text);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.14)),
    var(--char-note-bg);
  box-shadow:
    0 12px 24px rgba(58, 43, 32, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.36);
  transform-origin: center top;
}

.note-card.tilt-1 {
  transform: rotate(-0.6deg);
}

.note-card.tilt-2 {
  transform: rotate(0.5deg);
}

.note-card.tilt-3 {
  transform: rotate(-0.25deg);
}

.tape {
  position: absolute;
  left: 50%;
  top: -9px;
  width: 68px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 232, 153, 0.68);
  box-shadow: 0 2px 4px rgba(58, 43, 32, 0.08);
  transform: translateX(-50%) rotate(-3deg);
}

.heart-note .tape,
.favorite-note .tape {
  background: rgba(213, 226, 255, 0.7);
}

.diary-note .tape {
  background: rgba(255, 204, 213, 0.68);
}

.note-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.note-head strong {
  min-width: 0;
  color: inherit;
  font-size: 16px;
}

.note-head time,
.future-hint {
  color: var(--char-note-muted);
  font-size: 12px;
}

.note-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.72;
}

.heart-fields {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.heart-fields p {
  color: inherit;
}

.heart-fields span {
  display: inline-block;
  margin-right: 8px;
  color: var(--char-accent-text);
  font-size: 12px;
  font-weight: 900;
}

.memory-audio-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  margin-bottom: 10px;
  color: var(--char-accent-text);
  background: var(--char-accent-soft);
  font-weight: 900;
}

.memory-audio-btn i {
  font-size: 18px;
}

.memory-audio-btn.playing {
  color: var(--char-bg-end);
  background: var(--char-accent);
}

.soft-empty {
  border: 1px dashed var(--char-border-dashed);
  border-radius: 16px;
  padding: 18px;
  color: var(--char-text-muted);
  text-align: center;
}
</style>
