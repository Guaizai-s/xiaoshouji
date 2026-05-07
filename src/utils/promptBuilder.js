import { personaService, stickerService } from '../services/db';
import { buildStickerLibraryPrompt } from '../config/messageDirectives';
import { buildTimeContextPrompt } from './timeContext';

const section = (title, content) => {
  const clean = String(content || '').trim();
  return clean ? `[${title}]\n${clean}` : '';
};

export async function buildEnhancedSystemPrompt(role, contextMessages = []) {
  const settings = role?.chatSettings || {};
  const parts = [];

  if (settings.isRealTimeOn !== false) {
    parts.push(buildTimeContextPrompt(contextMessages));
  }

  parts.push(String(role?.systemPrompt || '').trim());
  parts.push(section('核心设定', settings.coreMemory));
  parts.push(section('长期记忆', settings.longTermMemory));

  if (settings.selectedPersonaId) {
    const persona = await personaService.getById(settings.selectedPersonaId);
    if (persona?.description) parts.push(section('用户信息', persona.description));

    const userStatus = localStorage.getItem('userStatus') || '';
    if (userStatus) parts.push(section('用户状态', userStatus));
  }

  if (settings.linkedLibraryId) {
    const linkedStickers = await stickerService.getByLibrary(settings.linkedLibraryId);
    parts.push(buildStickerLibraryPrompt(linkedStickers));
  }

  return parts.filter(Boolean).join('\n\n');
}
