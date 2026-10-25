import { useState } from 'react';
import { applyTheme, initializeTheme } from '../theme.js';
import { Icon } from './Icon.jsx';

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || initializeTheme());
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(applyTheme(nextTheme, { persist: true }))}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
