import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TransactionFilters } from "@/schemas/transaction";

import { fetchTransactionSummary } from "./fetch-transactions";
import { transactionKeys } from "./keys";

/**
 * Income, expense and balance for the list's filters. Its key has no page or
 * order, so paging and sorting do not load it again. After a change it is
 * refetched with everything under `transactionKeys.all`.
 */
export function useTransactionSummary(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.summary(filters),
    queryFn: ({ signal }) => fetchTransactionSummary(filters, signal),
    placeholderData: keepPreviousData,
  });
}
