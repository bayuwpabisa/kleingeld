import type { TransactionListQuery } from "@/schemas/transaction";

/**
 * Query keys for transactions, from broad to narrow, so one call can
 * invalidate them all (`transactionKeys.all`) or just the lists.
 */
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (query: TransactionListQuery) =>
    [...transactionKeys.lists(), query] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};
