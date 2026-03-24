// Minimax TTS 服务

/**
 * 调用 Minimax TTS API
 * @param {string} text - 要转换的文字
 * @param {Object} voiceSettings - 音色设置
 * @returns {Promise<string>} - 音频 URL
 */
export async function textToSpeech(text, voiceSettings = {}) {
  const minimax = JSON.parse(localStorage.getItem('globalMinimax') || '{}');

  if (!minimax.apiKey || !minimax.groupId) {
    throw new Error('请先配置 Minimax API Key 和 Group ID');
  }

  const response = await fetch('/api/minimax-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: minimax.apiKey,
      groupId: minimax.groupId,
      text,
      voiceId: voiceSettings.voiceId || 'male-qn-qingse',
      speed: voiceSettings.speed || 1.0,
      pitch: voiceSettings.pitch || 0
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `TTS 请求失败: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
