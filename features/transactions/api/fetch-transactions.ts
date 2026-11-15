import { apiFetch } from "@/lib/api/client";
import {
  DEFAULT_PAGE_SIZE,
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

/** "/path?a=1", or just "/path" when there is nothing to add. */
function withSearch(path: string, params: URLSearchParams) {
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
