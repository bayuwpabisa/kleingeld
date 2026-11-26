import { useQuery } from "@tanstack/react-query";

import { budgetKeys } from "./keys";
import { fetchBudgets } from "./requests";

/**
 * The user's budgets with the spending of `month` ("YYYY-MM"). Refetched
 * after every budget or transaction change (`budgetKeys.all`).
 */
export function useBudgets(month: string) {
  return useQuery({
    queryKey: budgetKeys.month(month),
    queryFn: ({ signal }) => fetchBudgets(month, signal),
  });
}
