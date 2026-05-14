export const MESSAGE_DIRECTIVES = [
  {
    type: 'voice',
    format: '[语音:文本]',
    description: '当某段内容适合用语音表达时使用。只输出语音标记，不要额外重复相同文字。'
  },
  {
    type: 'sticker',
    format: '[表情:表情名]',
    description: '当想发送表情包时使用。只能使用“可用表情包”列表里真实存在的表情名；如果列表为空或没有合适表情，不要输出表情指令，也不要编造表情名。'
  },
  {
    type: 'redpacket',
    format: '[红包:金额:备注]',
    description: '在自然聊天中给用户发红包时使用。每次回复最多使用一次红包或转账。'
  },
  {
    type: 'transfer',
    format: '[转账:金额:备注]',
    description: '在自然聊天中给用户转账时使用。每次回复最多使用一次红包或转账。'
  },
  {
    type: 'diary',
    format: '[日记:标题:正文]',
    description: '当这次聊天中出现值得纪念的日常片段、情绪波动、甜蜜瞬间、争执和和好、用户当天的状态、你作为角色的私人感受时使用。日记应使用第一人称，像角色自己的私人记录，可以有情绪和氛围，不要写成冷冰冰的事实总结；不要频繁使用。每次回复最多使用一次。'
  }
];

export function buildMessageDirectivesPrompt(types = MESSAGE_DIRECTIVES.map(item => item.type)) {
  const allowedTypes = new Set(types);
  const directives = MESSAGE_DIRECTIVES.filter(item => allowedTypes.has(item.type));
  if (directives.length === 0) return '';

  const lines = [
    '[特殊消息格式]',
    '你可以在自然聊天中使用以下特殊消息格式：',
    ...directives.map(item => `- ${item.format}：${item.description}`)
  ];

  if (allowedTypes.has('redpacket') || allowedTypes.has('transfer')) {
    lines.push('', '红包和转账的金额会由钱包逻辑处理；你只需要按格式输出金额字符串和备注。');
  }

  if (allowedTypes.has('sticker')) {
    lines.push('表情指令必须严格匹配可用表情包列表中的表情名，不能改写、简称、翻译或自创名称。');
  }

  lines.push('不要向用户解释这些格式，像正常聊天一样自然使用。');
  return lines.join('\n');
}

export const MESSAGE_DIRECTIVES_PROMPT = buildMessageDirectivesPrompt();

export function buildStickerLibraryPrompt(stickers = []) {
  const stickerList = stickers
    .map(sticker => `- ${sticker.name}${sticker.description ? `：${sticker.description}` : ''}`)
    .join('\n');

  if (!stickerList) return '';

  return [
    '[可用表情包]',
    '你只能使用下面列出的表情名发送表情包：',
    stickerList,
    '如果没有完全匹配的表情名，就不要输出 [表情:...]。'
  ].join('\n');
}
