import type { QueryClient } from "@tanstack/react-query";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Providers } from "@/app/providers";
import { makeQueryClient } from "@/lib/query-client";
import { makeStore, type AppStore } from "@/lib/store/store";

type ProviderOptions = {
  store?: AppStore;
  queryClient?: QueryClient;
};

type Options = Omit<RenderOptions, "wrapper"> & ProviderOptions;

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

function setupProviders({
  store = makeStore(),
  queryClient = makeTestQueryClient(store),
}: ProviderOptions) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Providers store={store} queryClient={queryClient}>
        {children}
      </Providers>
    );
  }
  return { store, queryClient, Wrapper };
}

/**
 * For tests only: render inside the same providers as the app (Redux store,
 * QueryClient, toast area), fresh for each test unless given.
 */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const {
    store: givenStore,
    queryClient: givenClient,
    ...renderOptions
  } = options;
  const { store, queryClient, Wrapper } = setupProviders({
    store: givenStore,
    queryClient: givenClient,
  });
  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/** The same providers around a hook, for testing hooks on their own. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: ProviderOptions = {},
) {
  const { store, queryClient, Wrapper } = setupProviders(options);
  return { store, queryClient, ...renderHook(hook, { wrapper: Wrapper }) };
}
