"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { Toaster } from "@/components/ui/toast";
import { makeQueryClient } from "@/lib/query-client";
import { makeStore, type AppStore } from "@/lib/store/store";

type ProvidersProps = {
  children: ReactNode;
  /** Tests pass their own; the app makes one of each per mount. */
  store?: AppStore;
  queryClient?: QueryClient;
};

/**
 * Client-side app state for every page: the Redux store (UI state), the
 * TanStack Query client (server state) and the toast area. Both are created
 * once per mount with useState, never at module level, so server renders of
 * different requests never share them.
 */
export function Providers({
  children,
  store: givenStore,
  queryClient: givenQueryClient,
}: ProvidersProps) {
  const [store] = useState(() => givenStore ?? makeStore());
  const [queryClient] = useState(
    () => givenQueryClient ?? makeQueryClient({ dispatch: store.dispatch }),
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
