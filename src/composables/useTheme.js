import { ref, computed } from 'vue';
import { SMS_THEME_KEY, applySmsTheme, initializeTheme } from '../utils/themeSync';

const themes = {
vanilla: {
    id: 'vanilla', name: '原生', desc: '柔和暖白',
    backgroundFx: '',
    previewFx: '',
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
    id: 'midnight', name: '夜间', desc: '低光深色',
    backgroundFx: '',
    previewFx: '',
    appBg: 'bg-[#121212]', headerBg: 'bg-[#121212]/90', headerBorder: 'border-[#2A2A2A]',
    cardBg: 'bg-[#1C1C1C]', tabBg: 'bg-[#121212]/85', searchBg: 'bg-[#1C1C1C]',
    myBubble: 'bg-[#2A2A2A] text-[#F5F5F5]', otherBubble: 'bg-[#1C1C1C] text-[#F5F5F5] border border-[#2A2A2A]',
    inputAreaBg: 'bg-[#121212]', inputBg: 'bg-[#1C1C1C] border-[#2A2A2A]',
    sendBtn: 'bg-[#E0E0E0] text-[#121212]', textMain: 'text-[#F5F5F5]', textMuted: 'text-[#666666]',
    iconBtnBg: 'bg-[#1C1C1C] border border-[#2A2A2A]', iconBg: 'bg-[#2A2A2A]',
    border: 'border-[#2A2A2A]', hoverBg: 'bg-[#252525]',
    ringActive: 'bg-[#E0E0E0]', switchBg: '!bg-[#E0E0E0]',
  },
  mono: {
    id: 'mono', name: '黑白晕染', desc: '墨灰渐变',
    backgroundFx: 'sms-ink-bg',
    previewFx: 'sms-mono-preview',
    appBg: 'bg-[#f4f4f2]',
    headerBg: 'bg-white/60',
    headerBorder: 'border-black/10',
    cardBg: 'bg-white/70',
    tabBg: 'bg-white/60',
    searchBg: 'bg-white/60',
    myBubble: 'bg-gradient-to-br from-[#111111] via-[#252525] to-[#4a4a4a] text-white shadow-[0_10px_28px_rgba(0,0,0,0.12)]',
    otherBubble: 'bg-white/70 text-[#151515] border border-white/70 shadow-[0_10px_28px_rgba(0,0,0,0.06)] backdrop-blur-md',
    inputAreaBg: 'bg-white/70 backdrop-blur-xl',
    inputBg: 'bg-white/70 border-white/75 shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
    sendBtn: 'bg-[#111111] text-white',
    textMain: 'text-[#111111]',
    textMuted: 'text-[#777777]',
    iconBtnBg: 'bg-white/70 border border-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
    iconBg: 'bg-black/10',
    border: 'border-black/10',
    hoverBg: 'bg-white/80',
    ringActive: 'bg-[#111111]',
    switchBg: '!bg-[#111111]',
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
  const t = computed(() => themes[activeTheme.value] || themes.vanilla);

  const setTheme = (id) => {
    const nextTheme = themes[id] ? id : 'vanilla';
    activeTheme.value = nextTheme;
    applySmsTheme(nextTheme, { syncSystem: false });
  };

  return { activeTheme, themes, t, setTheme };
}
