import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Theme keys
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  FOREST: 'forest', // Green + Gray
  SUNRISE: 'sunrise', // Orange + Blue
  OCEAN: 'ocean', // Blue + White
};

const THEME_LABELS = {
  [THEMES.DARK]: 'Dark',
  [THEMES.LIGHT]: 'Light',
  [THEMES.FOREST]: 'Forest',
  [THEMES.SUNRISE]: 'Sunrise',
  [THEMES.OCEAN]: 'Ocean',
};

const STORAGE_KEY = 'fixitfast.theme';

const ThemeContext = createContext({
  theme: THEMES.LIGHT,
  setTheme: () => {},
  themes: [],
  labels: {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEMES.LIGHT);

  useEffect(() => {
    // Load saved theme
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Object.values(THEMES).includes(saved)) {
        setThemeState(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Apply theme to <html> via data-theme attribute
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      // Smooth transition on theme switch
      root.style.transition = 'background-color 200ms ease, color 200ms ease';
      document.body.style.transition = 'background-color 200ms ease, color 200ms ease';
    }
    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = (val) => {
    if (Object.values(THEMES).includes(val)) {
      setThemeState(val);
    }
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    themes: Object.values(THEMES),
    labels: THEME_LABELS,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);