import { apiFetch } from "@/lib/api/client";
import {
  DEFAULT_PAGE_SIZE,
  type CategoryTotal,
  type CategoryTotalsQuery,
  type MonthlyTotal,
  type MonthlyTrendQuery,
  type TransactionFilters,
  type TransactionListQuery,
  type TransactionPage,
  type TransactionSummary,
} from "@/schemas/transaction";

import { toSearchParams } from "../list-query-url";

// The signal lets TanStack Query cancel a request whose result is no longer
// wanted, e.g. the previous search while the user keeps typing.

/** GET /api/transactions with the list's filters, order and page. */
export function fetchTransactions(
  query: TransactionListQuery,
  signal?: AbortSignal,
) {
  const params = toSearchParams(query);
  if (query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }
  return apiFetch<TransactionPage>(withSearch("/api/transactions", params), {
    signal,
  });
}

/** GET /api/transactions/summary with the same filters. */
export function fetchTransactionSummary(
  filters: TransactionFilters,
  signal?: AbortSignal,
) {
  return apiFetch<TransactionSummary>(
    withSearch("/api/transactions/summary", toSearchParams(filters)),
    { signal },
  );
}

/** GET /api/transactions/trend: income and expense per month of the range. */
export function fetchMonthlyTrend(
  query: MonthlyTrendQuery,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  return apiFetch<MonthlyTotal[]>(
    withSearch("/api/transactions/trend", params),
    { signal },
  );
}

/** GET /api/transactions/by-category: totals per category of one type. */
export function fetchCategoryTotals(
  query: CategoryTotalsQuery,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ type: query.type });
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiFetch<CategoryTotal[]>(
    withSearch("/api/transactions/by-category", params),
    { signal },
  );
}

/** "/path?a=1", or just "/path" when there is nothing to add. */
function withSearch(path: string, params: URLSearchParams) {
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
