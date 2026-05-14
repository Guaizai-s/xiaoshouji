export const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23ddd" width="120" height="120" rx="24"/%3E%3Cpath fill="%23999" d="M60 30a16 16 0 100 32 16 16 0 000-32zm0 39c-18 0-32 10.5-32 23.5V98h64v-5.5C92 79.5 78 69 60 69z"/%3E%3C/svg%3E';

export const defaultUserAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23f1e5d8" width="120" height="120" rx="60"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-size="42" fill="%239b7a5d"%3E你%3C/text%3E%3C/svg%3E';

export function normalizeProfile(raw = {}) {
  return {
    coverImage: raw.coverImage || '',
    gallery: Array.isArray(raw.gallery) ? raw.gallery.filter(Boolean) : [],
    summary: String(raw.summary || '').trim(),
    shortBio: String(raw.shortBio || '').trim(),
    tags: normalizeList(raw.tags),
    likes: normalizeList(raw.likes),
    dislikes: normalizeList(raw.dislikes),
    profession: String(raw.profession || '').trim(),
    relationships: Array.isArray(raw.relationships) ? raw.relationships : [],
    memoryItems: normalizeMemoryItems(raw.memoryItems)
  };
}

export const HEART_VOICE_FIELDS = [
  { key: 'currentStatus', label: '当前状态' },
  { key: 'currentThought', label: '当前想法' },
  { key: 'desiredAction', label: '想做的事' },
  { key: 'affection', label: '好感度' },
  { key: 'emotion', label: '情绪' },
  { key: 'observation', label: '观察' },
  { key: 'innerConflict', label: '内心矛盾' },
  { key: 'secret', label: '秘密' }
];

export function normalizeMemoryItems(value = []) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      id: item.id || `memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: item.type || 'note',
      title: String(item.title || '').trim(),
      content: String(item.content || '').trim(),
      data: item.data && typeof item.data === 'object' ? item.data : {},
      source: item.source || '',
      createdAt: Number(item.createdAt) || Date.now()
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createHeartVoiceMemory(data = {}) {
  const cleanData = {};
  HEART_VOICE_FIELDS.forEach(field => {
    const value = String(data[field.key] || '').trim();
    if (value) cleanData[field.key] = value;
  });

  return {
    id: `heart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'heart_voice',
    title: cleanData.emotion || '心声',
    content: cleanData.currentThought || cleanData.currentStatus || '',
    data: cleanData,
    source: 'heart_voice',
    createdAt: Date.now()
  };
}

export function coverStyle(role) {
  const image = normalizeProfile(role?.profile).coverImage || role?.avatar;
  return image ? { backgroundImage: `url(${image})` } : {};
}

export function roleSummary(role, max = 80) {
  const profile = normalizeProfile(role?.profile);
  return clip(
    profile.shortBio ||
      profile.summary ||
      promptSnippet(role?.systemPrompt, max) ||
      '暂无角色摘要',
    max
  );
}

export function splitList(text) {
  return String(text || '')
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function promptSnippet(text, max = 120) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clip(clean, max);
}

export function clip(text, max = 120) {
  const clean = String(text || '').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map(String).map(item => item.trim()).filter(Boolean)
    : [];
}
