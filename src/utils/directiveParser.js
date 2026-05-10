const DIRECTIVE_RE = /\[(语音|表情|红包|转账|日记|角色日记)[:：]([^\]]*)\]/g;

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

function splitDiaryPayload(payload) {
  const separatorIndex = payload.search(/[:：]/);
  if (separatorIndex < 0) {
    return {
      title: '',
      content: payload.trim()
    };
  }

  return {
    title: payload.slice(0, separatorIndex).trim(),
    content: payload.slice(separatorIndex + 1).trim()
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

  if (label === '日记' || label === '角色日记') {
    const { title, content } = splitDiaryPayload(payload);
    return content ? { type: 'diary', title, content } : null;
  }

  return null;
}

export function parseMessageDirectives(text = '') {
  const directives = [];
  let hasWalletDirective = false;
  let hasDiaryDirective = false;

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

    if (directive.type === 'diary') {
      directives.push({
        ...directive,
        index: offset,
        raw,
        executable: !hasDiaryDirective
      });
      hasDiaryDirective = true;
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
