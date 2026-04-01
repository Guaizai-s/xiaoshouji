// Claude API 调用服务
import { mergeSystemPrompts } from '../config/systemPrompts';

/**
 * 处理 Anthropic 流式响应
 */
async function handleAnthropicStream(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            const text = parsed.delta.text;
            buffer += text;
            fullText += text;

            // 遇到换行就发送一个气泡
            if (onChunk && buffer.includes('\n')) {
              const parts = buffer.split('\n');
              for (let i = 0; i < parts.length - 1; i++) {
                if (parts[i].trim()) {
                  onChunk(parts[i]);
                }
              }
              buffer = parts[parts.length - 1];
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  // 发送剩余内容
  if (onChunk && buffer.trim()) {
    onChunk(buffer);
  }

  return fullText;
}

/**
 * 处理 OpenAI 流式响应
 */
async function handleOpenAIStream(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.delta?.content) {
            const text = parsed.choices[0].delta.content;
            buffer += text;
            fullText += text;

            // 遇到换行就发送一个气泡
            if (onChunk && buffer.includes('\n')) {
              const parts = buffer.split('\n');
              for (let i = 0; i < parts.length - 1; i++) {
                if (parts[i].trim()) {
                  onChunk(parts[i]);
                }
              }
              buffer = parts[parts.length - 1];
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  // 发送剩余内容
  if (onChunk && buffer.trim()) {
    onChunk(buffer);
  }

  return fullText;
}

/**
 * 调用 Claude API
 * @param {Object} role - 角色配置
 * @param {Array} messages - 消息历史
 * @param {Function} onChunk - 流式回调（可选）
 * @returns {Promise<string>} - AI 回复内容
 */
export async function callClaude(role, messages, onChunk = null) {
  const { apiKey, baseUrl, model, apiFormat, systemPrompt } = role;

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  // 合并内置提示词和用户提示词
  const finalSystemPrompt = mergeSystemPrompts(systemPrompt);

  // 根据 API 格式构建请求
  if (apiFormat === 'anthropic') {
    return await callAnthropicAPI(baseUrl, apiKey, model, finalSystemPrompt, messages, onChunk);
  } else if (apiFormat === 'openai') {
    return await callOpenAIAPI(baseUrl, apiKey, model, finalSystemPrompt, messages, onChunk);
  } else {
    throw new Error('不支持的 API 格式');
  }
}

/**
 * 调用 Anthropic 官方 API
 */
async function callAnthropicAPI(baseUrl, apiKey, model, systemPrompt, messages, onChunk) {
  // 检查是否使用直接调用（国内API）
  const useDirect = localStorage.getItem('useDirectAPI') === 'true';
  const useStream = localStorage.getItem('useStreamAPI') === 'true';

  if (useDirect && baseUrl) {
    // 直接调用API（绕过Vercel代理）
    const url = baseUrl.endsWith('/messages') ? baseUrl :
                baseUrl.endsWith('/v1') ? `${baseUrl}/messages` :
                `${baseUrl}/v1/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt || '',
        messages: messages,
        stream: useStream
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }

    // 流式响应
    if (useStream) {
      return await handleAnthropicStream(response, onChunk);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // 使用 Vercel Function 代理（本地开发使用本地代理服务器）
  const apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/chat'
    : '/api/chat';

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
  // 检查是否使用直接调用（国内API）
  const useDirect = localStorage.getItem('useDirectAPI') === 'true';
  const useStream = localStorage.getItem('useStreamAPI') === 'true';

  // 转换消息格式（添加 system 消息）
  const openaiMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  if (useDirect && baseUrl) {
    // 直接调用API（绕过Vercel代理）
    const url = baseUrl.endsWith('/chat/completions') ? baseUrl :
                baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` :
                `${baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: openaiMessages,
        stream: useStream
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }

    // 流式响应
    if (useStream) {
      return await handleOpenAIStream(response);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // 使用 Vercel Function 代理（本地开发使用本地代理服务器）
  const apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/chat'
    : '/api/chat';

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

  // 合并内置提示词和用户提示词
  const finalSystemPrompt = mergeSystemPrompts(systemPrompt);

  // 检查是否使用直接调用
  const useDirect = localStorage.getItem('useDirectAPI') === 'true';

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

    // 直接调用
    if (useDirect && baseUrl) {
      const url = baseUrl.endsWith('/messages') ? baseUrl :
                  baseUrl.endsWith('/v1') ? `${baseUrl}/messages` :
                  `${baseUrl}/v1/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: finalSystemPrompt || '',
          messages
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
      }
      const data = await response.json();
      return data.content[0].text;
    }

    // 使用 Vercel Function
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey, baseUrl,
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: finalSystemPrompt || '',
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
    const messages = finalSystemPrompt
      ? [{ role: 'system', content: finalSystemPrompt }, ...contextMessages, openaiImageMessage]
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
