// Vercel Serverless Function - MiniMax API proxy.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const setCorsHeaders = (res) => {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
};

const sendJson = (res, status, body) => {
  setCorsHeaders(res);
  return res.status(status).json(body);
};

const readJsonError = async (response, fallback) => {
  const data = await response.json().catch(() => ({}));
  return data?.base_resp?.status_msg || data?.error?.message || data?.message || fallback;
};

const hexToBuffer = (hex) => Buffer.from(hex, 'hex');

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const {
      action = 'tts',
      apiKey,
      groupId,
      text,
      voiceId,
      speed,
      pitch,
      model
    } = req.body || {};

    if (!apiKey || !groupId) {
      return sendJson(res, 400, { error: 'Missing API key or Group ID' });
    }

    if (action === 'models') {
      const response = await fetch(`https://api.minimax.chat/v1/models?GroupId=${groupId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!response.ok) {
        return sendJson(res, response.status, {
          error: await readJsonError(response, 'MiniMax models API request failed')
        });
      }

      return sendJson(res, 200, await response.json());
    }

    if (!text) {
      return sendJson(res, 400, { error: 'Missing text' });
    }

    const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'speech-02-hd',
        text,
        stream: false,
        voice_setting: {
          voice_id: voiceId || 'male-qn-qingse',
          speed: speed || 1.0,
          pitch: pitch || 0
        }
      })
    });

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: await readJsonError(response, 'MiniMax TTS API request failed')
      });
    }

    const data = await response.json();
    if (data.base_resp?.status_code !== 0) {
      return sendJson(res, 502, { error: data.base_resp?.status_msg || 'MiniMax TTS failed' });
    }

    const audioHex = data.data?.audio;
    if (!audioHex) {
      return sendJson(res, 502, { error: 'MiniMax did not return audio data' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(hexToBuffer(audioHex));
  } catch (error) {
    console.error('MiniMax proxy error:', error);
    return sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
}
