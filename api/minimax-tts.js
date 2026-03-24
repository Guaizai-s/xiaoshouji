// Vercel Function - Minimax TTS API 代理

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, groupId, text, voiceId, speed, pitch } = req.body;

    if (!apiKey || !groupId) {
      return res.status(400).json({ error: '缺少 API Key 或 Group ID' });
    }

    const url = `https://api.minimax.chat/v1/text_to_speech?GroupId=${groupId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text,
        model: 'speech-01',
        voice_id: voiceId || 'male-qn-qingse',
        speed: speed || 1.0,
        pitch: pitch || 0
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: error.message || 'TTS API 调用失败' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Minimax TTS 错误:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}
