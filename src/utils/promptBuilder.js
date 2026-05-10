import { diaryService, personaService, stickerService, worldBookEntryService } from '../services/db';
import { buildMessageDirectivesPrompt, buildStickerLibraryPrompt } from '../config/messageDirectives';
import { buildTimeContextPrompt } from './timeContext';
import { buildWorldBookContext } from './worldBook';

const section = (title, content) => {
  const clean = String(content || '').trim();
  return clean ? `[${title}]\n${clean}` : '';
};

const clipText = (text, max = 1000) => {
  const clean = String(text || '').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
};

async function buildDiaryMemoryPrompt(role) {
  const settings = role?.chatSettings || {};
  if (!role?.id || settings.diaryMemoryEnabled !== true) return '';

  const limit = Math.min(20, Math.max(1, Number(settings.diaryMemoryLimit) || 3));
  const includeUser = settings.includeUserDiaries !== false;
  const includeRole = settings.includeRoleDiaries !== false;
  const diaries = await diaryService.getVisibleContextForRole(role.id, limit * 2);
  const selected = diaries
    .filter(entry => (entry.authorType === 'role' && includeRole) || (entry.authorType === 'user' && includeUser))
    .slice(0, limit);

  if (selected.length === 0) return '';

  const blocks = selected.map(entry => {
    const type = entry.authorType === 'role' ? '角色日记' : '用户日记';
    return `### ${entry.dateKey}｜${type}｜${entry.title || '未命名日记'}\n${clipText(entry.summary || entry.content, 1100)}`;
  });

  return [
    '[最近日记]',
    '以下是用户允许你看到、并设置为可作为记忆使用的日记。它们不是当前对话消息，而是长期记忆材料。请自然参考，不要生硬复述。',
    '',
    blocks.join('\n\n'),
    '[/最近日记]'
  ].join('\n');
}

export async function buildEnhancedSystemPrompt(role, contextMessages = [], options = {}) {
  const settings = role?.chatSettings || {};
  const parts = [buildMessageDirectivesPrompt(options.directiveTypes)];

  if (settings.isRealTimeOn !== false) {
    parts.push(buildTimeContextPrompt(contextMessages));
  }

  parts.push(String(role?.systemPrompt || '').trim());

  const worldBookEntries = await worldBookEntryService.getAll();
  const worldBook = buildWorldBookContext(worldBookEntries, contextMessages, options.worldBook);
  if (worldBook.text) {
    console.log('📚 世界书命中:', worldBook.entries.map(entry => entry.title).join(', '));
    parts.push(`[World Book / 世界书]\n${worldBook.text}\n[/World Book]`);
  }

  parts.push(section('核心设定', settings.coreMemory));
  parts.push(section('长期记忆', settings.longTermMemory));

  const diaryMemory = await buildDiaryMemoryPrompt(role);
  if (diaryMemory) parts.push(diaryMemory);

  if (settings.selectedPersonaId) {
    const persona = await personaService.getById(settings.selectedPersonaId);
    if (persona?.description) parts.push(section('用户信息', persona.description));

    const userStatus = localStorage.getItem('userStatus') || '';
    if (userStatus) parts.push(section('用户状态', userStatus));
  }

  if (settings.linkedLibraryId && (!options.directiveTypes || options.directiveTypes.includes('sticker'))) {
    const linkedStickers = await stickerService.getByLibrary(settings.linkedLibraryId);
    parts.push(buildStickerLibraryPrompt(linkedStickers));
  }

  return parts.filter(Boolean).join('\n\n');
}
