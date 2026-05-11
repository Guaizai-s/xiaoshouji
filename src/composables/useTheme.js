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
    appBg: 'bg-[#20211f]', headerBg: 'bg-[#24251f]/90', headerBorder: 'border-[#383832]',
    cardBg: 'bg-[#292a26]', tabBg: 'bg-[#24251f]/90', searchBg: 'bg-[#30312c]',
    myBubble: 'bg-[#3a3b35] text-[#f3eee5]', otherBubble: 'bg-[#292a26] text-[#f3eee5] border border-[#383832]',
    inputAreaBg: 'bg-[#24251f]', inputBg: 'bg-[#30312c] border-[#3d3d36]',
    sendBtn: 'bg-[#d8d0c2] text-[#20211f]', textMain: 'text-[#f3eee5]', textMuted: 'text-[#a69f93]',
    iconBtnBg: 'bg-[#30312c] border border-[#3d3d36]', iconBg: 'bg-[#34352f]',
    border: 'border-[#383832]', hoverBg: 'bg-[#33342f]',
    ringActive: 'bg-[#d8d0c2]', switchBg: '!bg-[#d8d0c2]',
  },
  mono: {
    id: 'mono', name: '黑白晕染', desc: '墨灰渐变',
    backgroundFx: 'sms-ink-bg',
    previewFx: 'sms-mono-preview',
    appBg: 'bg-[#f4f4f2]',
    headerBg: 'bg-white/80',
    headerBorder: 'border-black/10',
    cardBg: 'bg-white/75',
    tabBg: 'bg-white/80',
    searchBg: 'bg-white/75',
    myBubble: 'bg-gradient-to-br from-[#111111] via-[#252525] to-[#4a4a4a] text-white shadow-[0_10px_28px_rgba(0,0,0,0.12)]',
    otherBubble: 'bg-white/75 text-[#151515] border border-white/80 shadow-[0_10px_28px_rgba(0,0,0,0.06)] backdrop-blur-md',
    inputAreaBg: 'bg-white/80 backdrop-blur-xl',
    inputBg: 'bg-white/90 border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
    sendBtn: 'bg-[#111111] text-white',
    textMain: 'text-[#111111]',
    textMuted: 'text-[#777777]',
    iconBtnBg: 'bg-white/90 border border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
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
