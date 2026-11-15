import { apiFetch } from "@/lib/api/client";
import type {
  TransactionListQuery,
  TransactionPage,
} from "@/schemas/transaction";

/** GET /api/transactions. The signal lets TanStack Query cancel old requests. */
export function fetchTransactions(
  query: TransactionListQuery,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  return apiFetch<TransactionPage>(`/api/transactions?${params}`, { signal });
}
