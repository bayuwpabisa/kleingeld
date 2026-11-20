import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { fetchTransactions } from "./fetch-transactions";
import { transactionKeys, type InfiniteListQuery } from "./keys";

/**
 * The phone list: pages are added one by one with "Muat lebih banyak".
 * While another filter loads, the previous rows stay on screen.
 */
export function useInfiniteTransactions(query: InfiniteListQuery) {
  return useInfiniteQuery({
    queryKey: transactionKeys.infinite(query),
    queryFn: ({ pageParam, signal }) =>
      fetchTransactions({ ...query, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}
