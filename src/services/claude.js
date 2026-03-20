// Claude API 调用服务

/**
 * 调用 Claude API
 * @param {Object} role - 角色配置
 * @param {Array} messages - 消息历史
 * @returns {Promise<string>} - AI 回复内容
 */
export async function callClaude(role, messages) {
  const { apiKey, baseUrl, model, apiFormat, systemPrompt } = role;

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  // 根据 API 格式构建请求
  if (apiFormat === 'anthropic') {
    return await callAnthropicAPI(baseUrl, apiKey, model, systemPrompt, messages);
  } else if (apiFormat === 'openai') {
    return await callOpenAIAPI(baseUrl, apiKey, model, systemPrompt, messages);
  } else {
    throw new Error('不支持的 API 格式');
  }
}

/**
 * 调用 Anthropic 官方 API
 */
async function callAnthropicAPI(baseUrl, apiKey, model, systemPrompt, messages) {
  // 判断环境：生产环境使用Vercel Function，开发环境使用本地代理
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const apiUrl = isProduction ? '/api/chat' : 'http://localhost:3001/api/anthropic';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey,
      baseUrl,
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt || '',
      messages: messages,
      apiFormat: 'anthropic'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * 调用 OpenAI 兼容 API
 */
async function callOpenAIAPI(baseUrl, apiKey, model, systemPrompt, messages) {
  // 判断环境：生产环境使用Vercel Function，开发环境使用本地代理
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const apiUrl = isProduction ? '/api/chat' : 'http://localhost:3001/api/openai';

  // 转换消息格式（添加 system 消息）
  const openaiMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey,
      baseUrl,
      model: model || 'gpt-3.5-turbo',
      messages: openaiMessages,
      apiFormat: 'openai'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function callClaudeVision(role, imageBase64, mimeType, contextMessages = []) {
  const { apiKey, baseUrl, model, apiFormat, systemPrompt } = role;

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const apiUrl = isProduction ? '/api/chat' : 'http://localhost:3001/api/anthropic';

  // 图片消息放在最后一条 user 消息里
  const imageUserMessage = {
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: imageBase64 }
      },
      { type: 'text', text: '请结合我们的对话内容，描述或回应这张图片。' }
    ]
  };

  if (apiFormat === 'anthropic') {
    const messages = [...contextMessages, imageUserMessage];

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey, baseUrl,
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt || '',
        messages,
        apiFormat: 'anthropic'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.content[0].text;

  } else {
    // OpenAI 格式
    const openaiImageMessage = {
      role: 'user',
      content: [
        { type: 'text', text: '请结合我们的对话内容，描述或回应这张图片。' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
      ]
    };
    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...contextMessages, openaiImageMessage]
      : [...contextMessages, openaiImageMessage];

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey, baseUrl,
        model: model || 'gpt-4-vision-preview',
        max_tokens: 4096,
        messages,
        apiFormat: 'openai'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * 将文件转换为 Base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
