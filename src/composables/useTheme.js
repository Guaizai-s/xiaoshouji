import { ref, computed } from 'vue';

const STORAGE_KEY = 'smsTheme';

const themes = {
  blanc: {
    id: 'blanc', name: '灰白',
    appBg: 'bg-[#F9F9F9]', headerBg: 'bg-[#F9F9F9]/90', headerBorder: 'border-[#EAEAEA]',
    cardBg: 'bg-white', tabBg: 'bg-[#F9F9F9]/85', searchBg: 'bg-[#F0F0F0]',
    myBubble: 'bg-[#F0F0F0] text-[#222222]', otherBubble: 'bg-white text-[#222222] border border-[#EAEAEA]',
    inputAreaBg: 'bg-[#F9F9F9]', inputBg: 'bg-white border-[#EAEAEA]',
    sendBtn: 'bg-[#333333] text-white', textMain: 'text-[#222222]', textMuted: 'text-[#999999]',
    iconBtnBg: 'bg-white border border-[#EAEAEA]', iconBg: 'bg-[#F0F0F0]',
    border: 'border-[#EAEAEA]', hoverBg: 'bg-[#F4F4F4]',
    ringActive: 'bg-[#222222]', switchBg: '!bg-[#222222]',
    desc: '清冷高级画廊风'
  },
  vanilla: {
    id: 'vanilla', name: '奶茶',
    appBg: 'bg-[#F2EEE9]', headerBg: 'bg-[#F2EEE9]/90', headerBorder: 'border-[#E2DCD5]',
    cardBg: 'bg-[#FAF8F5]', tabBg: 'bg-[#F2EEE9]/85', searchBg: 'bg-[#E8E2DA]',
    myBubble: 'bg-[#B4A79A] text-white', otherBubble: 'bg-[#FAF8F5] text-[#4A433E] border border-[#E2DCD5]',
    inputAreaBg: 'bg-[#F2EEE9]', inputBg: 'bg-[#FAF8F5] border-[#E2DCD5]',
    sendBtn: 'bg-[#B4A79A] text-white', textMain: 'text-[#4A433E]', textMuted: 'text-[#9C948A]',
    iconBtnBg: 'bg-[#FAF8F5] border border-[#E2DCD5]', iconBg: 'bg-[#EAE4DD]',
    border: 'border-[#E2DCD5]', hoverBg: 'bg-[#EAE4DD]',
    ringActive: 'bg-[#B4A79A]', switchBg: '!bg-[#B4A79A]',
    desc: '温暖治愈奶油风'
  },
  midnight: {
    id: 'midnight', name: '夜间',
    appBg: 'bg-[#121212]', headerBg: 'bg-[#121212]/90', headerBorder: 'border-[#2A2A2A]',
    cardBg: 'bg-[#1C1C1C]', tabBg: 'bg-[#121212]/85', searchBg: 'bg-[#1C1C1C]',
    myBubble: 'bg-[#2A2A2A] text-[#F5F5F5]', otherBubble: 'bg-[#1C1C1C] text-[#F5F5F5] border border-[#2A2A2A]',
    inputAreaBg: 'bg-[#121212]', inputBg: 'bg-[#1C1C1C] border-[#2A2A2A]',
    sendBtn: 'bg-[#E0E0E0] text-[#121212]', textMain: 'text-[#F5F5F5]', textMuted: 'text-[#666666]',
    iconBtnBg: 'bg-[#1C1C1C] border border-[#2A2A2A]', iconBg: 'bg-[#2A2A2A]',
    border: 'border-[#2A2A2A]', hoverBg: 'bg-[#252525]',
    ringActive: 'bg-[#E0E0E0]', switchBg: '!bg-[#E0E0E0]',
    desc: '深邃暗夜护眼风'
  }
};

const activeTheme = ref(localStorage.getItem(STORAGE_KEY) || 'blanc');

export function useTheme() {
  const t = computed(() => themes[activeTheme.value]);

  const setTheme = (id) => {
    activeTheme.value = id;
    localStorage.setItem(STORAGE_KEY, id);
  };

  return { activeTheme, themes, t, setTheme };
}
