import React from 'react';
import { useTheme, THEMES } from '../../../context/ThemeContext';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { theme, setTheme, labels } = useTheme();

  return (
    <div className="theme-switcher" title="Theme">
      <label htmlFor="theme-select" className="sr-only">Theme</label>
      <select
        id="theme-select"
        aria-label="Select theme"
        className="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      >
        <option value={THEMES.DARK}>{labels[THEMES.DARK]}</option>
        <option value={THEMES.LIGHT}>{labels[THEMES.LIGHT]}</option>
        <option value={THEMES.FOREST}>{labels[THEMES.FOREST]}</option>
        <option value={THEMES.SUNRISE}>{labels[THEMES.SUNRISE]}</option>
        <option value={THEMES.OCEAN}>{labels[THEMES.OCEAN]}</option>
      </select>
    </div>
  );
};

export default ThemeSwitcher;
