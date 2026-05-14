import { onMounted, onUnmounted, ref } from 'vue';
import { SYSTEM_THEME_KEY, initializeTheme } from '../utils/themeSync';

export function useSystemTheme() {
  const currentTheme = ref(initializeTheme().systemTheme || 'theme-minimal');

  const syncTheme = (event) => {
    currentTheme.value = event?.detail?.systemTheme || localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
  };

  onMounted(() => {
    window.addEventListener('xiaoshouji-theme-change', syncTheme);
  });

  onUnmounted(() => {
    window.removeEventListener('xiaoshouji-theme-change', syncTheme);
  });

  return { currentTheme };
}
