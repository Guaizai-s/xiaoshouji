import { ref, computed } from 'vue';
import { SMS_THEME_KEY, applySmsTheme, initializeTheme } from '../utils/themeSync';

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
  },
vanilla: {
    id: 'vanilla', name: '原生',
    // 背景用最浅的
    appBg: 'bg-[#faf9f5]', 
    headerBg: 'bg-[#faf9f5]/90', 
    inputAreaBg: 'bg-[#faf9f5]',
    tabBg: 'bg-[#faf9f5]/85',
    myBubble: 'bg-[#f0eee6] text-[#4d4c48]', 
    otherBubble: 'bg-[#faf9f5] text-[#333333] border border-[#e8e6dc]',
    sendBtn: 'bg-[#d97757] text-white',
    ringActive: 'bg-[#d97757]',
    switchBg: '!bg-[#d97757]',
    cardBg: 'bg-white',
    inputBg: 'bg-white border-[#e8e6dc]',
    searchBg: 'bg-[#e8e6dc]',
    headerBorder: 'border-[#e8e6dc]',
    textMain: 'text-[#333333]',
    textMuted: 'text-[#8c8279]',
    iconBtnBg: 'bg-white border border-[#e8e6dc]',
    iconBg: 'bg-[#e8e6dc]',
    border: 'border-[#e8e6dc]',
    hoverBg: 'bg-[#e8e6dc]',
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
  }
};

const activeTheme = ref(initializeTheme().smsTheme || 'vanilla');

if (typeof window !== 'undefined') {
  window.addEventListener('xiaoshouji-theme-change', (event) => {
    const nextTheme = event.detail?.smsTheme || localStorage.getItem(SMS_THEME_KEY);
    if (nextTheme && themes[nextTheme]) activeTheme.value = nextTheme;
  });
}

export function useTheme() {
  const t = computed(() => themes[activeTheme.value]);

  const setTheme = (id) => {
    const nextTheme = themes[id] ? id : 'vanilla';
    activeTheme.value = nextTheme;
    applySmsTheme(nextTheme);
  };

  return { activeTheme, themes, t, setTheme };
}
