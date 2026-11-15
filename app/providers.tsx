"use client";

import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { Toaster } from "@/components/ui/toast";
import { makeStore, type AppStore } from "@/lib/store/store";

type ProvidersProps = {
  children: ReactNode;
  /** Tests pass their own; the app makes one per mount. */
  store?: AppStore;
};

/**
 * Client-side app state for every page: the Redux store (UI state) and the
 * toast area. Created once per mount with useState, never at module level,
 * so server renders of different requests never share a store.
 */
export function Providers({ children, store: givenStore }: ProvidersProps) {
  const [store] = useState(() => givenStore ?? makeStore());

  return (
    <ReduxProvider store={store}>
      {children}
      <Toaster />
    </ReduxProvider>
  );
}
