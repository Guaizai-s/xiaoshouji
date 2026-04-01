// Vercel Serverless Function - API代理
// 解决浏览器CORS限制问题

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { apiKey, baseUrl, model, messages, system, max_tokens, apiFormat, stream } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: { message: '缺少API Key' } });
    }

    let response;
    let url;

    // 根据API格式调用不同的端点
    if (apiFormat === 'openai') {
      const rawUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      if (rawUrl.endsWith('/chat/completions')) {
        url = rawUrl;
      } else if (rawUrl.endsWith('/v1')) {
        url = rawUrl + '/chat/completions';
      } else {
        url = rawUrl + '/v1/chat/completions';
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: max_tokens || 4096,
          stream: stream || false
        })
      });
    } else {
      const rawUrl = (baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
      if (rawUrl.endsWith('/messages')) {
        url = rawUrl;
      } else if (rawUrl.endsWith('/v1')) {
        url = rawUrl + '/messages';
      } else {
        url = rawUrl + '/v1/messages';
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: max_tokens || 4096,
          system: system || '',
          messages: messages,
          stream: stream || false
        })
      });
    }

    // 如果是流式响应，直接转发
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
      } catch (streamError) {
        console.error('流式传输错误:', streamError);
        res.end();
      }
      return;
    }

    // 非流式响应，保持原逻辑
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('API返回非JSON响应:', responseText.substring(0, 500));
      return res.status(502).json({
        error: {
          message: `API返回格式错误: ${responseText.substring(0, 100)}...`
        }
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('API调用错误:', error);
    return res.status(500).json({
      error: { message: error.message || '服务器内部错误' }
    });
  }
}
