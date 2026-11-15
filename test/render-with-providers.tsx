import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Providers } from "@/app/providers";
import { makeStore, type AppStore } from "@/lib/store/store";

type Options = Omit<RenderOptions, "wrapper"> & { store?: AppStore };

/**
 * For tests only: render inside the same providers as the app (Redux store,
 * toast area), with a fresh store per test unless one is given.
 */
export function renderWithProviders(
  ui: ReactElement,
  { store = makeStore(), ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Providers store={store}>{children}</Providers>;
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
