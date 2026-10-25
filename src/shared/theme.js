export const THEME_KEY = 'bridge-builder:theme';

function storedTheme() {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function preferredTheme() {
  return storedTheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function applyTheme(theme, { persist = false } = {}) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* The current tab still changes theme when storage is unavailable. */
    }
  }
  return theme;
}

export function initializeTheme() {
  return applyTheme(preferredTheme());
}
