import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "./api/client";
import type { AppDispatch } from "./store/store";
import { showToast } from "./store/toast-slice";

/**
 * Retry only what may work a second time: network failures and server
 * errors (5xx), at most twice. A 4xx is the server's real answer.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
}

/**
 * After a 401 the session is gone: sign in again and come back here. A full
 * page load on purpose, not router.push: it also throws away this user's
 * cached data and store, and this runs outside React, without a router.
 */
function redirectToLogin() {
  const here = window.location.pathname + window.location.search;
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears client state, see above
  window.location.assign(`/login?next=${encodeURIComponent(here)}`);
}

type QueryClientDeps = {
  /** The Redux store's dispatch, for toasts from outside React. */
  dispatch: AppDispatch;
  onUnauthorized?: () => void;
};

/**
 * The app's QueryClient (server state). Its global error handlers run outside
 * React, which is why they talk to the Redux store directly.
 */
export function makeQueryClient({
  dispatch,
  onUnauthorized = redirectToLogin,
}: QueryClientDeps) {
  const isUnauthorized = (error: unknown) =>
    error instanceof ApiError && error.status === 401;

  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (isUnauthorized(error)) {
          onUnauthorized();
          return;
        }
        // A first load that fails shows its own error box in the page. Here
        // only refetches that fail while old data stays on screen.
        if (query.state.data !== undefined) {
          dispatch(
            showToast({ message: "Data gagal diperbarui. Coba lagi nanti." }),
          );
        }
      },
    }),
    mutationCache: new MutationCache({
      onError(error) {
        if (isUnauthorized(error)) onUnauthorized();
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
