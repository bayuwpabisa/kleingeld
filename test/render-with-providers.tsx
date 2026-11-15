import type { QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Providers } from "@/app/providers";
import { makeQueryClient } from "@/lib/query-client";
import { makeStore, type AppStore } from "@/lib/store/store";

type Options = Omit<RenderOptions, "wrapper"> & {
  store?: AppStore;
  queryClient?: QueryClient;
};

/** The app's QueryClient for tests: no retries, so failures show at once. */
export function makeTestQueryClient(store: AppStore) {
  const queryClient = makeQueryClient({
    dispatch: store.dispatch,
    onUnauthorized: () => {},
  });
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, retry: false },
  });
  return queryClient;
}

/**
 * For tests only: render inside the same providers as the app (Redux store,
 * QueryClient, toast area), fresh for each test unless given.
 */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const {
    store = makeStore(),
    queryClient = makeTestQueryClient(store),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Providers store={store} queryClient={queryClient}>
        {children}
      </Providers>
    );
  }
  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
