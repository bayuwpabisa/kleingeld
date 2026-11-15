"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches, kept in sync when it changes. Null on
 * the server and during hydration, where the window is unknown: render a
 * placeholder then, not a guess.
 *
 * Use it only to choose what to run (e.g. one data query or another); for
 * looks alone, CSS breakpoints are simpler and need no JS.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
}
