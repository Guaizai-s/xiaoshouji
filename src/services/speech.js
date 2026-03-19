// 语音识别服务（使用Web Speech API）

/**
 * 开始语音识别
 * @returns {Promise<string>} - 识别的文字
 */
export function startVoiceRecognition() {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('当前浏览器不支持语音识别'));
      return;
    }

    const recognition = new SpeechRecognition();

    // 设置语言为中文
    recognition.lang = 'zh-CN';

    // 不连续识别，说完一句话就停止
    recognition.continuous = false;

    // 返回临时结果
    recognition.interimResults = false;

    // 最大识别结果数
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      let errorMessage = '语音识别失败';

      switch (event.error) {
        case 'no-speech':
          errorMessage = '没有检测到语音';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝';
          break;
        case 'network':
          errorMessage = '网络错误';
          break;
        default:
          errorMessage = `识别错误: ${event.error}`;
      }

      reject(new Error(errorMessage));
    };

    recognition.onend = () => {
      // 如果没有触发 onresult，可能是超时
    };

    try {
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 检查是否支持语音识别
 */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
