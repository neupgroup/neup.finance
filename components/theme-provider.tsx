"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export type ShadowLevel = 'light' | 'medium' | 'heavy';

export const SHADOW_LEVEL_STORAGE_KEY = 'neup.finance.shadow-level';

// Validate the persisted setting before using it to select a theme class.
function getStoredShadowLevel(): ShadowLevel {
  if (typeof window === 'undefined') return 'medium';
  const savedLevel = window.localStorage.getItem(SHADOW_LEVEL_STORAGE_KEY);
  return savedLevel === 'light' || savedLevel === 'heavy' ? savedLevel : 'medium';
}

// Register every persisted appearance choice with next-themes.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [shadowLevel, setShadowLevel] = useState<ShadowLevel>('medium');

  useEffect(() => {
    if (window.localStorage.getItem('theme') === 'black') {
      window.localStorage.setItem('theme', 'dark');
      document.documentElement.classList.remove('black');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    setShadowLevel(getStoredShadowLevel());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SHADOW_LEVEL_STORAGE_KEY) setShadowLevel(getStoredShadowLevel());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('shadow-level-light', 'shadow-level-medium', 'shadow-level-heavy');
    document.documentElement.classList.add(`shadow-level-${shadowLevel}`);
  }, [shadowLevel]);

  return <NextThemesProvider enableColorScheme={false} themes={["light", "dark"]} {...props}>{children}</NextThemesProvider>;
}
