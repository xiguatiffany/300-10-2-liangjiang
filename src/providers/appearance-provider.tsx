'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  APPEARANCE_STORAGE_KEY,
  brandThemes,
  colorModes,
  defaultAppearance,
  densities,
  type AppearanceState,
  type BrandTheme,
  type ColorMode,
  type Density,
} from '@/lib/design-system/tokens';

type AppearanceContextValue = AppearanceState & {
  setColorMode: (mode: ColorMode) => void;
  setBrandTheme: (theme: BrandTheme) => void;
  setDensity: (density: Density) => void;
  toggleColorMode: () => void;
  reset: () => void;
};

const AppearanceCtx = createContext<AppearanceContextValue | null>(null);

function applyDom(state: AppearanceState) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', state.colorMode === 'dark');
  if (state.brandTheme === 'default') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.brandTheme);
  root.setAttribute('data-density', state.density);
  root.style.colorScheme = state.colorMode;
}

function readStored(): AppearanceState {
  if (typeof window === 'undefined') return defaultAppearance;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return defaultAppearance;
    const parsed = JSON.parse(raw) as Partial<AppearanceState>;
    return {
      colorMode: colorModes.includes(parsed.colorMode as ColorMode)
        ? (parsed.colorMode as ColorMode)
        : defaultAppearance.colorMode,
      brandTheme: brandThemes.includes(parsed.brandTheme as BrandTheme)
        ? (parsed.brandTheme as BrandTheme)
        : defaultAppearance.brandTheme,
      density: densities.includes(parsed.density as Density)
        ? (parsed.density as Density)
        : defaultAppearance.density,
    };
  } catch {
    return defaultAppearance;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppearanceState>(defaultAppearance);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readStored();
    setState(next);
    applyDom(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyDom(state);
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state, ready]);

  const setColorMode = useCallback((colorMode: ColorMode) => {
    setState((s) => ({ ...s, colorMode }));
  }, []);

  const setBrandTheme = useCallback((brandTheme: BrandTheme) => {
    setState((s) => ({ ...s, brandTheme }));
  }, []);

  const setDensity = useCallback((density: Density) => {
    setState((s) => ({ ...s, density }));
  }, []);

  const toggleColorMode = useCallback(() => {
    setState((s) => ({
      ...s,
      colorMode: s.colorMode === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const reset = useCallback(() => setState(defaultAppearance), []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      ...state,
      setColorMode,
      setBrandTheme,
      setDensity,
      toggleColorMode,
      reset,
    }),
    [state, setColorMode, setBrandTheme, setDensity, toggleColorMode, reset],
  );

  return <AppearanceCtx.Provider value={value}>{children}</AppearanceCtx.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceCtx);
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return ctx;
}
