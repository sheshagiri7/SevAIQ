import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const THEME_STORAGE_KEY = 'SEVAIQ_THEME';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // ignore
  }

  // First-time visitors always default to the professional light government-portal theme.
  // OS dark-mode preference does not force a dark appearance on first-time visitors.
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initial = getInitialTheme();
    if (typeof document !== 'undefined' && document.documentElement) {
      const root = document.documentElement;
      if (initial === 'dark') {
        root.classList?.add('dark');
        root.classList?.remove('light');
        root.setAttribute?.('data-theme', 'dark');
        if (root.style) root.style.colorScheme = 'dark';
      } else {
        root.classList?.remove('dark');
        root.classList?.add('light');
        root.setAttribute?.('data-theme', 'light');
        if (root.style) root.style.colorScheme = 'light';
      }
    }
    return initial;
  });

  // Sync DOM with theme
  const applyThemeToDOM = useCallback((currentTheme: ThemeMode) => {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      if (root.style) root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      if (root.style) root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    applyThemeToDOM(newTheme);
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Apply on mount and when theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  // Do not let OS dark-mode preference override the citizen's view unexpectedly.
  // Dark mode is preserved when manually chosen by the citizen.

  const isDark = theme === 'dark';

  const contextValue = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setTheme,
    }),
    [theme, isDark, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
