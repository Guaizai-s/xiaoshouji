import { personaService, stickerService, worldBookEntryService } from '../services/db';
import { buildMessageDirectivesPrompt, buildStickerLibraryPrompt } from '../config/messageDirectives';
import { buildTimeContextPrompt } from './timeContext';
import { buildWorldBookContext } from './worldBook';

const section = (title, content) => {
  const clean = String(content || '').trim();
  return clean ? `[${title}]\n${clean}` : '';
};

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
