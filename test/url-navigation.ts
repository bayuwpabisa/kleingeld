import { useMemo, useSyncExternalStore } from "react";

// For tests: a stand-in for the parts of `next/navigation` that read the URL,
// backed by jsdom's real window.location and history. Use it with
//   jest.mock("next/navigation", () => jest.requireActual("@/test/url-navigation"));
// Components then see their own pushState/replaceState calls, as they do
// with the Next.js router, and tests can read window.location.

const listeners = new Set<() => void>();
let patched = false;

function notify() {
  for (const listener of listeners) listener();
}

// Next.js syncs its hooks with pushState/replaceState; do the same here.
function patchHistory() {
  if (patched) return;
  patched = true;
  const { pushState, replaceState } = window.history;
  window.history.pushState = (...args: Parameters<History["pushState"]>) => {
    pushState.apply(window.history, args);
    notify();
  };
  window.history.replaceState = (
    ...args: Parameters<History["replaceState"]>
  ) => {
    replaceState.apply(window.history, args);
    notify();
  };
  window.addEventListener("popstate", notify);
}

function subscribe(listener: () => void) {
  patchHistory();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** Puts the test at this URL before rendering. */
export function setUrl(url: string) {
  window.history.replaceState(null, "", url);
}
