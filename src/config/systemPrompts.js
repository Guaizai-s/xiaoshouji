// 内置系统提示词（对用户不可见）

export const BUILTIN_PROMPTS = {
  // 语音功能说明
  voice: `你具备语音输出能力。当你认为某段内容适合用语音表达时，只输出语音标记，格式：[语音:文本内容]，不要再额外输出相同的文字内容。`,

  // 可以添加更多内置提示词
  // emoji: `...`,
  // tools: `...`,
};

/**
 * 合并内置提示词和用户提示词
 * @param {string} userPrompt - 用户的系统提示词
 * @returns {string} - 合并后的完整提示词
 */
export function mergeSystemPrompts(userPrompt = '') {
  const builtinPrompts = Object.values(BUILTIN_PROMPTS).join('\n\n---\n\n');

  if (!userPrompt || !userPrompt.trim()) {
    return builtinPrompts;
  }

  // 检查用户提示词是否以"# 系统时间信息"开头，如果是，则将时间信息提到最前面
  if (userPrompt.startsWith('# 系统时间信息')) {
    const timeBlockEnd = userPrompt.indexOf('\n\n');
    if (timeBlockEnd > 0) {
      const timeBlock = userPrompt.substring(0, timeBlockEnd);
      const restPrompt = userPrompt.substring(timeBlockEnd + 2).trim();

      if (restPrompt) {
        return `${timeBlock}\n\n${builtinPrompts}\n\n---\n\n${restPrompt}`;
      } else {
        return `${timeBlock}\n\n${builtinPrompts}`;
      }
    }
  }

  return `${builtinPrompts}\n\n---\n\n${userPrompt}`;
}
