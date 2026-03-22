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
    const { apiKey, baseUrl, model, messages, system, max_tokens, apiFormat } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: { message: '缺少API Key' } });
    }

    let response;
    let url;

    // 根据API格式调用不同的端点
    if (apiFormat === 'openai') {
      // OpenAI格式 - 智能补全URL
      const rawUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      // 如果URL不包含具体路径就自动补全
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
          max_tokens: max_tokens || 4096
        })
      });
    } else {
      // Anthropic格式 - 智能补全URL
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
          messages: messages
        })
      });
    }

    // 获取响应文本
    const responseText = await response.text();

    // 尝试解析JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // 如果不是JSON，返回错误信息
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
