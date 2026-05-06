const DIRECTIVE_RE = /\[(语音|表情|红包|转账)[:：]([^\]]*)\]/g;

function splitWalletPayload(payload) {
  const separatorIndex = payload.search(/[:：]/);
  if (separatorIndex < 0) {
    return {
      amount: payload.trim(),
      note: ''
    };
  }

  return {
    amount: payload.slice(0, separatorIndex).trim(),
    note: payload.slice(separatorIndex + 1).trim()
  };
}

function toDirective(label, payload) {
  const value = payload.trim();

  if (label === '语音') {
    return value ? { type: 'voice', text: value } : null;
  }

  if (label === '表情') {
    return value ? { type: 'sticker', name: value } : null;
  }

  if (label === '红包') {
    const { amount, note } = splitWalletPayload(payload);
    return amount ? { type: 'redpacket', amount, note } : null;
  }

  if (label === '转账') {
    const { amount, note } = splitWalletPayload(payload);
    return amount ? { type: 'transfer', amount, note } : null;
  }

  return null;
}

export function parseMessageDirectives(text = '') {
  const directives = [];
  let hasWalletDirective = false;

  const cleanText = String(text).replace(DIRECTIVE_RE, (raw, label, payload, offset) => {
    const directive = toDirective(label, payload);
    if (!directive) return raw;

    if (directive.type === 'redpacket' || directive.type === 'transfer') {
      directives.push({
        ...directive,
        index: offset,
        raw,
        executable: !hasWalletDirective
      });
      hasWalletDirective = true;
      return '';
    }

    directives.push({ ...directive, index: offset, raw });
    return '';
  }).trim();

  return {
    cleanText,
    directives
  };
}
