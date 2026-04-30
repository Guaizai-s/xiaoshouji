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

const roleLabel = (role) => (role === 'user' ? 'user' : 'assistant');

export function buildTimeContextPrompt(contextMessages = [], now = new Date()) {
  const currentTime = formatBeijingDateTime(now);
  const messageTimes = contextMessages
    .map((message, index) => {
      const time = message.timestamp ? formatBeijingDateTime(message.timestamp) : '';
      return time ? `${index + 1}. ${roleLabel(message.role)} message time: ${time}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const parts = [
    '# System time context',
    `Current Beijing time: ${currentTime} (${getBeijingWeekday(now)})`,
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
