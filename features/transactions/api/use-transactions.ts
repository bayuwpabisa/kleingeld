import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TransactionListQuery } from "@/schemas/transaction";

import { fetchTransactions } from "./fetch-transactions";
import { transactionKeys } from "./keys";

/**
 * One page of the user's transactions. While another page or filter loads,
 * the previous result stays on screen instead of a skeleton.
 */
export function useTransactions(query: TransactionListQuery) {
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: ({ signal }) => fetchTransactions(query, signal),
    placeholderData: keepPreviousData,
  });
}
