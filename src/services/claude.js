// Claude API 调用服务
import { mergeSystemPrompts } from '../config/systemPrompts';

const CHAT_PROXY_ENDPOINT = '/api/chat';
const USE_VERCEL_PROXY_KEY = 'useVercelProxy';

const useVercelProxy = () => localStorage.getItem(USE_VERCEL_PROXY_KEY) === 'true';

/**
 * 带有自动重试机制的 fetch
 */
async function fetchWithRetry(url, options, maxRetries = 2, baseDelay = 1000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    // 增加超时控制：60秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const fetchOptions = { ...options, signal: controller.signal };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // 如果遇到中转服务器常见的 502/503/504 错误，也进行重试
      if (!response.ok && [502, 503, 504].includes(response.status) && attempt < maxRetries) {
        console.warn(`服务器返回 ${response.status}，准备重试...`);
        throw new Error(`Server Error: ${response.status}`);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const isNetworkError = error.name === 'TypeError' && error.message.toLowerCase().includes('fetch');
      const isTimeout = error.name === 'AbortError';
      
      if (attempt >= maxRetries) {
        if (isNetworkError) {
          throw new Error('网络请求失败 (Failed to fetch)。这通常是因为中转API节点波动、超时或跨域被拦截，请稍后重试。');
        }
        if (isTimeout) {
          throw new Error('网络请求超时 (Timeout)。服务器响应时间过长。');
        }
        throw error;
      }
      
      attempt++;
      console.warn(`请求出现异常(${error.message})，${baseDelay * attempt}ms 后进行第 ${attempt} 次重试...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
    }
  }
}

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
  const { apiKey, baseUrl, model, apiFormat, systemPrompt, skipSystemPromptMerge = false } = role;

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  // 聊天界面会先通过 promptBuilder 统一拼接完整提示词，避免重复追加内置指令。
  const finalSystemPrompt = skipSystemPromptMerge
    ? (systemPrompt || '')
    : mergeSystemPrompts(systemPrompt);

  console.log('📤 发送给API的系统提示词（前200字符）:', finalSystemPrompt.substring(0, 200));
  console.log('📤 消息数量:', messages.length);

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
  const useStream = localStorage.getItem('useStreamAPI') === 'true';
  const useProxy = useVercelProxy();

  // 构建 API URL
  const url = baseUrl
    ? (baseUrl.endsWith('/messages') ? baseUrl :
       baseUrl.endsWith('/v1') ? `${baseUrl}/messages` :
       `${baseUrl}/v1/messages`)
    : 'https://api.anthropic.com/v1/messages';

  const requestBody = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt || '',
    messages: messages,
    stream: useStream
  };

  const response = await fetchWithRetry(useProxy ? CHAT_PROXY_ENDPOINT : url, {
    method: 'POST',
    headers: useProxy
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
    body: JSON.stringify(useProxy
      ? { ...requestBody, apiKey, baseUrl, apiFormat: 'anthropic' }
      : requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
  }

  // 流式响应（useStream=true，或服务端强制返回了 SSE 格式）
  const isSSE = (response.headers.get('Content-Type') || '').includes('text/event-stream');
  if (useStream || isSSE) {
    return await handleAnthropicStream(response, onChunk);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * 调用 OpenAI 兼容 API
 */
async function callOpenAIAPI(baseUrl, apiKey, model, systemPrompt, messages, onChunk) {
  const useStream = localStorage.getItem('useStreamAPI') === 'true';
  const useProxy = useVercelProxy();

  // 转换消息格式（添加 system 消息）
  const openaiMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // 构建 API URL
  const url = baseUrl
    ? (baseUrl.endsWith('/chat/completions') ? baseUrl :
       baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` :
       `${baseUrl}/v1/chat/completions`)
    : 'https://api.openai.com/v1/chat/completions';

  const requestBody = {
    model: model || 'gpt-3.5-turbo',
    messages: openaiMessages,
    stream: useStream
  };

  const response = await fetchWithRetry(useProxy ? CHAT_PROXY_ENDPOINT : url, {
    method: 'POST',
    headers: useProxy
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
    body: JSON.stringify(useProxy
      ? { ...requestBody, apiKey, baseUrl, apiFormat: 'openai' }
      : requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
  }

  // 流式响应（useStream=true，或服务端强制返回了 SSE 格式）
  const isSSE = (response.headers.get('Content-Type') || '').includes('text/event-stream');
  if (useStream || isSSE) {
    return await handleOpenAIStream(response, onChunk);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function callClaudeVision(role, imageBase64, mimeType, contextMessages = []) {
  const { apiKey, baseUrl, model, apiFormat, systemPrompt } = role;
  const useProxy = useVercelProxy();

  if (!apiKey) {
    throw new Error('请配置 API Key');
  }

  // 合并内置提示词和用户提示词
  const finalSystemPrompt = mergeSystemPrompts(systemPrompt);

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

    // 构建 API URL
    const url = baseUrl
      ? (baseUrl.endsWith('/messages') ? baseUrl :
         baseUrl.endsWith('/v1') ? `${baseUrl}/messages` :
         `${baseUrl}/v1/messages`)
      : 'https://api.anthropic.com/v1/messages';

    const requestBody = {
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: finalSystemPrompt || '',
      messages
    };

    const response = await fetchWithRetry(useProxy ? CHAT_PROXY_ENDPOINT : url, {
      method: 'POST',
      headers: useProxy
        ? { 'Content-Type': 'application/json' }
        : {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
      body: JSON.stringify(useProxy
        ? { ...requestBody, apiKey, baseUrl, apiFormat: 'anthropic' }
        : requestBody)
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

    // 构建 API URL
    const url = baseUrl
      ? (baseUrl.endsWith('/chat/completions') ? baseUrl :
         baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` :
         `${baseUrl}/v1/chat/completions`)
      : 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
      model: model || 'gpt-4-vision-preview',
      max_tokens: 4096,
      messages
    };

    const response = await fetchWithRetry(useProxy ? CHAT_PROXY_ENDPOINT : url, {
      method: 'POST',
      headers: useProxy
        ? { 'Content-Type': 'application/json' }
        : {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
      body: JSON.stringify(useProxy
        ? { ...requestBody, apiKey, baseUrl, apiFormat: 'openai' }
        : requestBody)
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
