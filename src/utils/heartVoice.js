const FIELD_ALIASES = {
  currentStatus: ['currentStatus', '当前状态', '状态'],
  currentThought: ['currentThought', '当前想法', '想法'],
  desiredAction: ['desiredAction', '想做的事', '想做的事情', '行动倾向'],
  affection: ['affection', '好感度', '好感'],
  emotion: ['emotion', '情绪'],
  observation: ['observation', '观察'],
  innerConflict: ['innerConflict', '内心矛盾', '矛盾'],
  secret: ['secret', '秘密']
};

const pickValue = (source, aliases) => {
  for (const key of aliases) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return '';
};

const normalizeValue = (value) => {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).join('\n');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value ?? '').trim();
};

const extractJson = (text) => {
  const clean = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('心声返回格式不是 JSON');
    return JSON.parse(match[0]);
  }
};

export function parseHeartVoiceResponse(text) {
  const parsed = extractJson(text);
  const result = {};

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    result[field] = normalizeValue(pickValue(parsed, aliases));
  }

  const required = ['currentStatus', 'currentThought', 'desiredAction', 'affection', 'emotion'];
  const missing = required.filter(key => !result[key]);
  if (missing.length > 0) {
    throw new Error(`心声缺少字段：${missing.join(', ')}`);
  }

  return result;
}

export function buildHeartVoiceMessages(contextMessages = []) {
  const messages = contextMessages.map(message => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: String(message.content || '')
  }));

  messages.push({
    role: 'user',
    content: '请基于以上聊天和设定，生成此刻的角色心声。只输出 JSON。'
  });

  return messages;
}
