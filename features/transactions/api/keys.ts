import type { QueryKey } from "@tanstack/react-query";

import {
  transactionListQuerySchema,
  type CategoryTotalsQuery,
  type MonthlyTrendQuery,
  type TransactionFilters,
  type TransactionListQuery,
} from "@/schemas/transaction";

/** The phone list loads page after page, so its key has no page. */
export type InfiniteListQuery = Omit<TransactionListQuery, "page">;

/**
 * Query keys for transactions, from broad to narrow, so one call can
 * invalidate them all (`transactionKeys.all`) or just the lists. Both list
 * shapes (one page on desktop, loaded pages on phones) sit under `lists()`.
 * Totals (summary, trend, per category) are outside `lists()`: optimistic
 * updates leave them alone, and they are refetched after every change.
 */
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (query: TransactionListQuery) =>
    [...transactionKeys.lists(), query] as const,
  infinite: (query: InfiniteListQuery) =>
    [...transactionKeys.lists(), "infinite", query] as const,
  summaries: () => [...transactionKeys.all, "summary"] as const,
  summary: (filters: TransactionFilters) =>
    [...transactionKeys.summaries(), filters] as const,
  trend: (query: MonthlyTrendQuery) =>
    [...transactionKeys.all, "trend", query] as const,
  byCategory: (query: CategoryTotalsQuery) =>
    [...transactionKeys.all, "by-category", query] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

/**
 * The query a cached list was loaded with: the last part of its key. Read
 * back through the schema, so the result is typed without trusting the key.
 * The phone list's key has no page, which reads as page 1.
 */
export function listQueryFromKey(key: QueryKey): TransactionListQuery | null {
  const result = transactionListQuerySchema.safeParse(key.at(-1));
  return result.success ? result.data : null;
}
