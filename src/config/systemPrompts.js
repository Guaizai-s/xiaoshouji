// 内置系统提示词（对用户不可见）

export const BUILTIN_PROMPTS = {
  // 语音功能说明
  voice: `你具备语音输出能力。当你认为某段内容适合用语音表达时，使用格式：[语音:文本内容]
注意：语音标记会被移除，请严格按照格式`,

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

  return `${builtinPrompts}\n\n---\n\n${userPrompt}`;
}
