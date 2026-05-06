export const MESSAGE_DIRECTIVES = [
  {
    type: 'voice',
    format: '[语音:文本]',
    description: '当某段内容适合用语音表达时使用。只输出语音标记，不要额外重复相同文字。'
  },
  {
    type: 'sticker',
    format: '[表情:表情名]',
    description: '当想发送表情包时使用。表情名应优先从可用表情包列表中选择。'
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
  }
];

export const MESSAGE_DIRECTIVES_PROMPT = [
  '[特殊消息格式]',
  '你可以在自然聊天中使用以下特殊消息格式：',
  ...MESSAGE_DIRECTIVES.map(item => `- ${item.format}：${item.description}`),
  '',
  '红包和转账的金额会由钱包逻辑处理；你只需要按格式输出金额字符串和备注。',
  '不要向用户解释这些格式，像正常聊天一样自然使用。'
].join('\n');

export function buildStickerLibraryPrompt(stickers = []) {
  const stickerList = stickers
    .map(sticker => `${sticker.name}:${sticker.description || ''}`)
    .join('、');

  if (!stickerList) return '';

  return `[可用表情包]\n${stickerList}`;
}
