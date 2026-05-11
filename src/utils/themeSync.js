export const SYSTEM_THEME_KEY = 'systemTheme';
export const SMS_THEME_KEY = 'smsTheme';

const systemToSmsTheme = {
  'theme-nordic': 'vanilla',
  'theme-minimal': 'vanilla',
  'theme-data': 'midnight'
};

const smsToSystemTheme = {
  vanilla: 'theme-minimal',
  midnight: 'theme-data'
};

const smsThemes = new Set(['vanilla', 'midnight', 'mono']);

export const normalizeSmsTheme = (themeId) => smsThemes.has(themeId) ? themeId : 'vanilla';
export const getSmsThemeForSystemTheme = (themeId) => systemToSmsTheme[themeId] || 'vanilla';
export const getSystemThemeForSmsTheme = (themeId) => {
  if (themeId === 'mono' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
  }
  return smsToSystemTheme[themeId] || 'theme-minimal';
};

export function applyWechatTheme(themeId) {
  if (themeId === 'theme-data') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function emitThemeChange(systemTheme, smsTheme) {
  window.dispatchEvent(new CustomEvent('xiaoshouji-theme-change', {
    detail: { systemTheme, smsTheme }
  }));
}

export function applySystemTheme(themeId, { syncSms = true, notify = true } = {}) {
  const systemTheme = themeId || 'theme-minimal';
  const smsTheme = getSmsThemeForSystemTheme(systemTheme);

  localStorage.setItem(SYSTEM_THEME_KEY, systemTheme);
  if (syncSms) localStorage.setItem(SMS_THEME_KEY, smsTheme);
  applyWechatTheme(systemTheme);
  if (notify) emitThemeChange(systemTheme, syncSms ? smsTheme : localStorage.getItem(SMS_THEME_KEY));

  return { systemTheme, smsTheme };
}

export function applySmsTheme(themeId, { syncSystem = true, notify = true } = {}) {
  const smsTheme = normalizeSmsTheme(themeId || 'vanilla');
  const systemTheme = getSystemThemeForSmsTheme(smsTheme);

  localStorage.setItem(SMS_THEME_KEY, smsTheme);
  if (syncSystem) {
    localStorage.setItem(SYSTEM_THEME_KEY, systemTheme);
    applyWechatTheme(systemTheme);
  }
  if (notify) emitThemeChange(syncSystem ? systemTheme : localStorage.getItem(SYSTEM_THEME_KEY), smsTheme);

  return { systemTheme, smsTheme };
}

export function initializeTheme() {
  const systemTheme = localStorage.getItem(SYSTEM_THEME_KEY) || 'theme-minimal';
  const smsTheme = normalizeSmsTheme(localStorage.getItem(SMS_THEME_KEY) || getSmsThemeForSystemTheme(systemTheme));

  localStorage.setItem(SYSTEM_THEME_KEY, systemTheme);
  localStorage.setItem(SMS_THEME_KEY, smsTheme);
  applyWechatTheme(systemTheme);

  return { systemTheme, smsTheme };
}
