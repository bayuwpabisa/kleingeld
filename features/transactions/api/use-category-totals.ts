import { useQuery } from "@tanstack/react-query";

import type { CategoryTotalsQuery } from "@/schemas/transaction";

import { fetchCategoryTotals } from "./fetch-transactions";
import { transactionKeys } from "./keys";

/**
 * Totals per category of one type, largest first. After a change it is
 * refetched with everything under `transactionKeys.all`.
 */
export function useCategoryTotals(query: CategoryTotalsQuery) {
  return useQuery({
    queryKey: transactionKeys.byCategory(query),
    queryFn: ({ signal }) => fetchCategoryTotals(query, signal),
  });
}
