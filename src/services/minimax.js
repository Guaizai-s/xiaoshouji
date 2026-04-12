// Minimax TTS 服务

/**
 * 获取 MiniMax 可用的 TTS 模型列表
 * @returns {Promise<Array>} - TTS 模型列表
 */
export async function getTTSModels() {
  const minimax = JSON.parse(localStorage.getItem('globalMinimax') || '{}');

  if (!minimax.apiKey || !minimax.groupId) {
    throw new Error('请先配置 Minimax API Key 和 Group ID');
  }

  try {
    const url = `https://api.minimax.chat/v1/models?GroupId=${minimax.groupId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${minimax.apiKey}`
      }
    });

    if (!response.ok) {
      console.warn('无法获取模型列表，使用预设列表');
      return getDefaultTTSModels();
    }

    const data = await response.json();
    // 过滤出 TTS 相关的模型
    const ttsModels = data.data?.filter(m => m.id.includes('speech') || m.id.includes('tts')) || [];
    return ttsModels.length > 0 ? ttsModels : getDefaultTTSModels();
  } catch (error) {
    console.warn('获取模型列表失败，使用预设列表:', error);
    return getDefaultTTSModels();
  }
}

/**
 * 获取预设的 TTS 模型列表
 * @returns {Array} - 预设 TTS 模型
 */
function getDefaultTTSModels() {
  return [
    { id: 'speech-01', name: 'Speech-01', description: 'MiniMax 标准语音合成模型' },
    { id: 'speech-02', name: 'Speech-02', description: 'MiniMax 高级语音合成模型' }
  ];
}

/**
 * 获取 MiniMax 可用的语音音色列表
 * @returns {Promise<Array>} - 语音音色列表
 */
export async function getVoiceModels() {
  // 返回预设的常用音色列表
  return [
    { voice_id: 'male-qn-qingse', name: '青涩青年音色', gender: 'male', description: '青涩、青年、活力' },
    { voice_id: 'male-qn-jingying', name: '精英青年音色', gender: 'male', description: '精英、青年、专业' },
    { voice_id: 'male-qn-badao', name: '霸道青年音色', gender: 'male', description: '霸道、青年、强势' },
    { voice_id: 'male-qn-daxuesheng', name: '青年大学生音色', gender: 'male', description: '青年、学生、阳光' },
    { voice_id: 'female-shaonv', name: '少女音色', gender: 'female', description: '少女、甜美、活泼' },
    { voice_id: 'female-yujie', name: '御姐音色', gender: 'female', description: '御姐、成熟、知性' },
    { voice_id: 'female-chengshu', name: '成熟女性音色', gender: 'female', description: '成熟、温柔、稳重' },
    { voice_id: 'female-tianmei', name: '甜美女性音色', gender: 'female', description: '甜美、温柔、亲切' },
    { voice_id: 'presenter_male', name: '男性主持人', gender: 'male', description: '主持、专业、大气' },
    { voice_id: 'presenter_female', name: '女性主持人', gender: 'female', description: '主持、专业、优雅' },
    { voice_id: 'audiobook_male_1', name: '男性有声书1', gender: 'male', description: '有声书、沉稳、磁性' },
    { voice_id: 'audiobook_male_2', name: '男性有声书2', gender: 'male', description: '有声书、温和、舒缓' },
    { voice_id: 'audiobook_female_1', name: '女性有声书1', gender: 'female', description: '有声书、温柔、动听' },
    { voice_id: 'audiobook_female_2', name: '女性有声书2', gender: 'female', description: '有声书、清新、自然' }
  ];
}

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

  const url = `https://api.minimax.chat/v1/text_to_speech?GroupId=${minimax.groupId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${minimax.apiKey}`
    },
    body: JSON.stringify({
      text,
      voice_id: voiceSettings.voiceId || 'male-qn-qingse',
      speed: voiceSettings.speed || 1.0,
      pitch: voiceSettings.pitch || 0,
      model: voiceSettings.model || 'speech-01'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `TTS 请求失败: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
