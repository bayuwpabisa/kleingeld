import { dehydrate, type DehydratedState } from "@tanstack/react-query";

import type { AppDb } from "@/db/types";
import { transactionKeys } from "@/features/transactions/api/keys";
import {
  listTransactions,
  monthlyTotals,
  summarizeTransactions,
  totalsByCategory,
} from "@/features/transactions/server/transactions-repo";
import { prefetchQueryClient } from "@/lib/prefetch-client";

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

/** One client per request (lib/prefetch-client.ts). */
const requestQueryClient = () => prefetchQueryClient("Dashboard");

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
