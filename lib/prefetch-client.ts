import { QueryCache, QueryClient } from "@tanstack/react-query";

/**
 * Server only: a QueryClient for one request's prefetch, whose state a page
 * hands to <HydrationBoundary>. No retries, so a failing database does not
 * hold the page back; a failed query is left out of the state (dehydrate
 * keeps only successful ones) and the browser loads it itself, showing its
 * error state with "Coba lagi". The error is logged as "<label> prefetch
 * failed", since nothing else sees it.
 */
export function prefetchQueryClient(label: string) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => console.error(`${label} prefetch failed`, error),
    }),
    // TanStack already skips retries on the server; said here so the page
    // does not depend on that default.
    defaultOptions: { queries: { retry: false } },
  });
}
