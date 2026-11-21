import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import type { TransactionDto } from "@/schemas/transaction";

import { transactionKeys } from "./keys";
import { findCachedTransaction } from "./optimistic";
import { fetchTransaction } from "./requests";

/**
 * One transaction, for the edit form and the delete confirmation. The row
 * already in a cached list shows at once while the fresh copy loads. A
 * temporary "optimistic-" row is never fetched: the server has no such id.
 */
export function useTransaction(id: string | null) {
  const queryClient = useQueryClient();
  const fetchable = id !== null && !id.startsWith("optimistic-");

  // The type is spelled out: with a placeholder function TanStack would
  // otherwise infer the function itself as the data type.
  return useQuery<TransactionDto>({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: fetchable
      ? ({ signal }) => fetchTransaction(id, signal)
      : skipToken,
    placeholderData: () =>
      id ? findCachedTransaction(queryClient, id) : undefined,
  });
}
