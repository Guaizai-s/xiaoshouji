// Minimax TTS 服务

const MINIMAX_PROXY_ENDPOINT = '/api/minimax-tts';
const useVercelProxy = () => localStorage.getItem('useVercelProxy') === 'true';

/**
 * 获取 MiniMax 可用的 TTS 模型列表
 * @returns {Promise<Array>} - TTS 模型列表
 */
export async function getTTSModels() {
  const minimax = JSON.parse(localStorage.getItem('globalMinimax') || '{}');

  if (!minimax.apiKey || !minimax.groupId) {
    throw new Error('请先配置 Minimax API Key 和 Group ID');
  }

  const url = `https://api.minimax.chat/v1/models?GroupId=${minimax.groupId}`;
  const useProxy = useVercelProxy();

  const response = await fetch(useProxy ? MINIMAX_PROXY_ENDPOINT : url, {
    method: useProxy ? 'POST' : 'GET',
    headers: useProxy
      ? { 'Content-Type': 'application/json' }
      : { 'Authorization': `Bearer ${minimax.apiKey}` },
    body: useProxy
      ? JSON.stringify({ action: 'models', apiKey: minimax.apiKey, groupId: minimax.groupId })
      : undefined
  });

  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.status}`);
  }

  const data = await response.json();
  const models = data.data?.filter(m => m.id.includes('speech') || m.id.includes('tts')) || [];
  if (models.length === 0) throw new Error('未获取到 TTS 模型，请检查 API Key 和 Group ID');
  return models;
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

  const url = `https://api.minimax.chat/v1/t2a_v2?GroupId=${minimax.groupId}`;
  const useProxy = useVercelProxy();

  const requestBody = {
    model: voiceSettings.model || 'speech-02-hd',
    text,
    stream: false,
    voice_setting: {
      voice_id: voiceSettings.voiceId || 'male-qn-qingse',
      speed: voiceSettings.speed || 1.0,
      pitch: voiceSettings.pitch || 0,
    }
  };

  const response = await fetch(useProxy ? MINIMAX_PROXY_ENDPOINT : url, {
    method: 'POST',
    headers: useProxy
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${minimax.apiKey}`
        },
    body: JSON.stringify(useProxy
      ? {
          action: 'tts',
          apiKey: minimax.apiKey,
          groupId: minimax.groupId,
          text,
          model: requestBody.model,
          voiceId: requestBody.voice_setting.voice_id,
          speed: requestBody.voice_setting.speed,
          pitch: requestBody.voice_setting.pitch
        }
      : requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.base_resp?.status_msg || `TTS 请求失败: ${response.status}`);
  }

  if (useProxy) {
    return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: 'audio/mpeg' }));
  }

  const data = await response.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(data.base_resp?.status_msg || 'TTS 失败');
  }

  // t2a_v2 返回 hex 编码音频
  const hex = data.data?.audio;
  if (!hex) throw new Error('未返回音频数据');
  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
}
