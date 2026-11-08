"use client";

import {
  createContext,
  use,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyTheme,
  readTheme,
  storeTheme,
  subscribeToTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeApi = {
  /** The user's choice. "system" follows the OS setting. */
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeApi | null>(null);

/** The theme preference and its setter. Use inside `ThemeProvider`. */
export function useTheme(): ThemeApi {
  const api = use(ThemeContext);
  if (!api) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return api;
}

// The server cannot see localStorage, so it renders "system". The inline
// script in <head> has already set the real theme on <html> by then.
const getServerSnapshot = (): ThemePreference => "system";

/**
 * Light, dark or system theme. The preference lives in localStorage and on
 * `<html data-theme>`; this provider reads it as an external store, so all
 * tabs and components stay in sync without copying it into React state.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readTheme,
    getServerSnapshot,
  );

  // Puts the attribute back after React resets <html> (Strict Mode remount in
  // development) and applies changes from other tabs. It reads storage, not
  // `theme`, because during hydration `theme` is still the server's "system".
  useLayoutEffect(() => {
    applyTheme(readTheme());
  }, [theme]);

  const api = useMemo(() => ({ theme, setTheme: storeTheme }), [theme]);

  return <ThemeContext value={api}>{children}</ThemeContext>;
}
