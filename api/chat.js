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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, baseUrl, model, messages, system, max_tokens, apiFormat } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: { message: '缺少API Key' } });
    }

    // 根据API格式调用不同的端点
    if (apiFormat === 'openai') {
      // OpenAI格式
      const url = baseUrl || 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: max_tokens || 4096
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);
    } else {
      // Anthropic格式（默认）
      const url = baseUrl || 'https://api.anthropic.com/v1/messages';

      const response = await fetch(url, {
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
          messages: messages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('API调用错误:', error);
    return res.status(500).json({
      error: { message: error.message || '服务器内部错误' }
    });
  }
}
