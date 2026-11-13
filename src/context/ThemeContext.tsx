import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from '../data/themes';
import { ModePreference, ThemeDefinition, ThemeId } from '../types';

interface ThemeContextType {
  currentTheme: ThemeDefinition;
  activeThemeId: ThemeId;
  modePreference: ModePreference;
  effectiveMode: 'light' | 'dark';
  systemPrefersDark: boolean;
  setTheme: (themeId: ThemeId) => void;
  setModePreference: (mode: ModePreference) => void;
  themesList: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'academic_app_theme_id';
const MODE_STORAGE_KEY = 'academic_app_mode_pref';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'cyberpunk';
  });

  const [modePreference, setModePreferenceState] = useState<ModePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MODE_STORAGE_KEY) as ModePreference;
      if (saved && ['system', 'light', 'dark'].includes(saved)) {
        return saved;
      }
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS device theme changes in real time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute effective mode: if 'system', follow OS, otherwise use manual choice
  const effectiveMode: 'light' | 'dark' =
    modePreference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : modePreference;

  const currentTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];

  // Apply CSS variables and DOM data attributes whenever theme or mode changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const activeVars = effectiveMode === 'dark' ? currentTheme.darkVars : currentTheme.lightVars;

    // Set data attributes for standard styling
    root.setAttribute('data-theme', activeThemeId);
    root.setAttribute('data-mode', effectiveMode);

    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply all custom properties to :root
    Object.entries(activeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [currentTheme, effectiveMode, activeThemeId]);

  const setTheme = (themeId: ThemeId) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  };

  const setModePreference = (mode: ModePreference) => {
    setModePreferenceState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        activeThemeId,
        modePreference,
        effectiveMode,
        systemPrefersDark,
        setTheme,
        setModePreference,
        themesList: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
