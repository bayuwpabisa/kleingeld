import {
  dehydrate,
  QueryCache,
  QueryClient,
  type DehydratedState,
} from "@tanstack/react-query";

import type { AppDb } from "@/db/types";
import { transactionKeys } from "@/features/transactions/api/keys";
import {
  listTransactions,
  monthlyTotals,
  summarizeTransactions,
  totalsByCategory,
} from "@/features/transactions/server/transactions-repo";

import {
  currentMonthFilters,
  monthCategoriesQuery,
  RECENT_QUERY,
  trendRange,
} from "../dashboard-queries";

// Server only. Reads the dashboard's data straight from the database and
// returns it as query cache state for <HydrationBoundary>, under the keys the
// browser's hooks use (features/transactions/api). The browser then shows it
// at once and keeps it fresh after changes, like any other query.

/**
 * One client per request. No retries, so a failing database does not hold
 * the page back; a failed query is left out of the state (dehydrate keeps
 * only successful ones) and the browser loads it itself, showing its error
 * state with "Coba lagi". The error is logged here, since nothing else sees it.
 */
function requestQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => console.error("Dashboard prefetch failed", error),
    }),
    // TanStack already skips retries on the server; said here so the page
    // does not depend on that default.
    defaultOptions: { queries: { retry: false } },
  });
}

/** Income, expense and balance of the month of `today` ("YYYY-MM-DD"). */
export async function prefetchMonthSummary(
  db: AppDb,
  userId: string,
  today: string,
): Promise<DehydratedState> {
  const queryClient = requestQueryClient();
  const filters = currentMonthFilters(today);
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.summary(filters),
    queryFn: () => summarizeTransactions(db, userId, filters),
  });
  return dehydrate(queryClient);
}

/** The five newest transactions ("Transaksi terbaru"). */
export async function prefetchRecentTransactions(
  db: AppDb,
  userId: string,
): Promise<DehydratedState> {
  const queryClient = requestQueryClient();
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.list(RECENT_QUERY),
    queryFn: () => listTransactions(db, userId, RECENT_QUERY),
  });
  return dehydrate(queryClient);
}

/** Income and expense of the month of `today` and the five before it. */
export async function prefetchMonthlyTrend(
  db: AppDb,
  userId: string,
  today: string,
): Promise<DehydratedState> {
  const queryClient = requestQueryClient();
  const range = trendRange(today);
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.trend(range),
    queryFn: () => monthlyTotals(db, userId, range),
  });
  return dehydrate(queryClient);
}

/** The expense of the month of `today` per category ("Per kategori"). */
export async function prefetchMonthCategories(
  db: AppDb,
  userId: string,
  today: string,
): Promise<DehydratedState> {
  const queryClient = requestQueryClient();
  const query = monthCategoriesQuery(today);
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.byCategory(query),
    queryFn: () => totalsByCategory(db, userId, query),
  });
  return dehydrate(queryClient);
}
