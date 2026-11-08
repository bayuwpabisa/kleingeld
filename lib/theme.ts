/**
 * Theme preference, stored in localStorage (not a cookie: reading a cookie in
 * the root layout would make every page dynamic, so the landing page could not
 * be prerendered). "system" is stored as no value: <html> then has no
 * `data-theme` and the CSS follows `prefers-color-scheme` (app/globals.css).
 */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

// `storage` only fires in other tabs, so this tab gets its own event.
const CHANGE_EVENT = "kleingeld:themechange";

function isExplicitTheme(value: unknown): value is "light" | "dark" {
  return value === "light" || value === "dark";
}

/** The stored preference. Anything unknown, or no storage at all, is "system". */
export function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isExplicitTheme(value) ? value : "system";
  } catch {
    return "system";
  }
}

/** Sets or removes `data-theme` on <html>. */
export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Stores the preference and tells subscribers in this tab. */
export function storeTheme(theme: ThemePreference) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode, site data off): the choice lasts until
    // reload, which is still better than ignoring the click.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls `onChange` when the preference changes here or in another tab. */
export function subscribeToTheme(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    // key is null when another tab calls localStorage.clear().
    if (event.key === null || event.key === THEME_STORAGE_KEY) onChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Runs in <head> before the first paint, so a stored theme never flashes the
 * other one. Keep it in sync with `readTheme` and `applyTheme`.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
