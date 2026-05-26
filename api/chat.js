// Vercel Serverless Function - chat API proxy.
// Used when the browser cannot call a provider directly because of CORS.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
};

const jsonResponse = (res, status, data) => {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(status).json(data);
};

const normalizeOpenAIUrl = (baseUrl) => {
  const rawUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  if (rawUrl.endsWith('/chat/completions')) return rawUrl;
  if (rawUrl.endsWith('/v1')) return `${rawUrl}/chat/completions`;
  return `${rawUrl}/v1/chat/completions`;
};

const normalizeAnthropicUrl = (baseUrl) => {
  const rawUrl = (baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  if (rawUrl.endsWith('/messages')) return rawUrl;
  if (rawUrl.endsWith('/v1')) return `${rawUrl}/messages`;
  return `${rawUrl}/v1/messages`;
};

const readUpstreamError = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text || `API request failed: ${response.status}` } };
  }
};

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: { message: 'Method not allowed' } });
  }

  try {
    const {
      apiKey,
      baseUrl,
      model,
      messages,
      system,
      max_tokens,
      apiFormat = 'anthropic',
      stream = false
    } = req.body || {};

    if (!apiKey) {
      return jsonResponse(res, 400, { error: { message: 'Missing API key' } });
    }

    if (!Array.isArray(messages)) {
      return jsonResponse(res, 400, { error: { message: 'Missing messages' } });
    }

    const isOpenAI = apiFormat === 'openai';
    const url = isOpenAI ? normalizeOpenAIUrl(baseUrl) : normalizeAnthropicUrl(baseUrl);
    const upstreamBody = isOpenAI
      ? {
          model: model || 'gpt-3.5-turbo',
          messages,
          max_tokens: max_tokens || 4096,
          stream: !!stream
        }
      : {
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: max_tokens || 4096,
          system: system || '',
          messages,
          stream: !!stream
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: isOpenAI
        ? {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        : {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
      body: JSON.stringify(upstreamBody)
    });

    if (!response.ok) {
      return jsonResponse(res, response.status, await readUpstreamError(response));
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (!reader) return res.end();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } finally {
        res.end();
      }
      return;
    }

    const responseText = await response.text();
    try {
      return jsonResponse(res, 200, JSON.parse(responseText));
    } catch {
      return jsonResponse(res, 502, {
        error: { message: `API returned non-JSON response: ${responseText.slice(0, 100)}...` }
      });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return jsonResponse(res, 500, {
      error: { message: error.message || 'Internal server error' }
    });
  }
}
