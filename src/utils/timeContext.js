const formatBeijingDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hours = get('hour');
  const minutes = get('minute');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getBeijingWeekday = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long'
  }).format(date);
};

const getBeijingDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

const getLastTimedMessage = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.timestamp) return messages[i];
  }
  return null;
};

const roleLabel = (role) => (role === 'user' ? 'user' : 'assistant');

export function buildTimeContextPrompt(contextMessages = [], now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const currentTime = formatBeijingDateTime(nowDate);
  const lastMessage = getLastTimedMessage(contextMessages);
  const lastMessageTime = lastMessage ? formatBeijingDateTime(lastMessage.timestamp) : 'none';
  const crossedDay = lastMessage
    ? getBeijingDateKey(nowDate) !== getBeijingDateKey(lastMessage.timestamp)
    : false;
  const messageTimes = contextMessages
    .map((message, index) => {
      const time = message.timestamp ? formatBeijingDateTime(message.timestamp) : '';
      return time ? `${index + 1}. ${roleLabel(message.role)} message time: ${time}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const parts = [
    '# Time reminder summary',
    `当前北京时间：${currentTime}（${getBeijingWeekday(nowDate)}）`,
    `上一条消息时间：${lastMessageTime}`,
    `当前时间与上一条消息是否跨天：${crossedDay ? '是' : '否'}`,
    `原始数据：nowMs=${nowDate.getTime()}; lastMessageMs=${lastMessage?.timestamp || 'none'}; timezone=Asia/Shanghai; contextMessageCount=${contextMessages.length}`,
    'Use this short reminder first when deciding whether to mention today, yesterday, elapsed time, or day changes.',
    '',
    '# System time context',
    `Current Beijing time: ${currentTime} (${getBeijingWeekday(nowDate)})`,
    'Use this true system time when the user asks about dates, time, elapsed time, recency, or ordering.',
    '',
    '# Message time metadata',
    messageTimes || 'No message-level timestamps are available.',
    '',
    '# Output rule',
    'The message times above are internal metadata, not part of the chat text. Do not add a timestamp, date label, or bracketed time prefix to your reply unless the user explicitly asks for that format.'
  ];

  return parts.join('\n');
}
