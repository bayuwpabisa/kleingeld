import { dehydrate, type DehydratedState } from "@tanstack/react-query";

import type { AppDb } from "@/db/types";
import { prefetchQueryClient } from "@/lib/prefetch-client";

import { budgetKeys } from "../api/keys";
import { monthOf } from "../budget-status";
import { listBudgetStatus } from "./budgets-repo";

/**
 * Server only. The user's budgets with the spending of the month of `today`
 * ("YYYY-MM-DD"), as query cache state under the key `useBudgets` reads, for
 * <HydrationBoundary>. Used by the Budget page and the dashboard's card.
 */
export async function prefetchBudgets(
  db: AppDb,
  userId: string,
  today: string,
): Promise<DehydratedState> {
  const queryClient = prefetchQueryClient("Budget");
  const month = monthOf(today);
  await queryClient.prefetchQuery({
    queryKey: budgetKeys.month(month),
    queryFn: () => listBudgetStatus(db, userId, month),
  });
  return dehydrate(queryClient);
}
