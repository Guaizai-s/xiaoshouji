const DEFAULT_OPTIONS = {
  scanDepth: 1,
  maxEntries: 8,
  maxChars: 6000
};

const normalizeText = (value) => String(value || '').toLowerCase();

const getRecentText = (recentMessages = [], scanDepth = 1, latestUserMessage = '') => {
  if (latestUserMessage) return normalizeText(latestUserMessage);

  return recentMessages
    .slice(-Math.max(1, scanDepth))
    .map(message => message?.content || '')
    .join('\n')
    .toLowerCase();
};

export function getTriggeredWorldBookEntries(entries = [], recentMessages = [], options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const recentText = getRecentText(recentMessages, opts.scanDepth, opts.latestUserMessage);

  return entries
    .filter(entry => entry?.enabled !== false && entry?.content)
    .filter(entry => {
      if (entry.triggerType === 'always') return true;
      if (entry.triggerType !== 'keyword') return false;
      const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
      return keywords.some(keyword => {
        const clean = normalizeText(keyword).trim();
        return clean && recentText.includes(clean);
      });
    })
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
}

export function buildWorldBookContext(entries = [], recentMessages = [], options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const triggered = getTriggeredWorldBookEntries(entries, recentMessages, opts);
  const selected = [];
  let usedChars = 0;

  for (const entry of triggered) {
    if (selected.length >= opts.maxEntries) break;

    const block = `### ${entry.title || '未命名条目'}\n${String(entry.content || '').trim()}`;
    const extra = selected.length > 0 ? block.length + 2 : block.length;
    if (usedChars + extra > opts.maxChars) {
      const remaining = opts.maxChars - usedChars - (selected.length > 0 ? 2 : 0);
      if (remaining > 80) {
        selected.push(block.slice(0, remaining).trim());
      }
      break;
    }

    selected.push(block);
    usedChars += extra;
  }

  if (selected.length === 0) {
    return { text: '', entries: [] };
  }

  return {
    text: `## 世界书设定\n\n${selected.join('\n\n')}`,
    entries: triggered.slice(0, selected.length)
  };
}
