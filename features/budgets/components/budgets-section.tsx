import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { prefetchBudgets } from "../server/prefetch-budgets";
import { Budgets } from "./budgets";

/**
 * Server Component: reads this month's budgets for the signed-in user and
 * hands them to Budgets through the query cache. Render it inside
 * <Suspense> with BudgetsSkeleton.
 */
export async function BudgetsSection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchBudgets(db, user.id, today);

  return (
    <HydrationBoundary state={state}>
      <Budgets today={today} />
    </HydrationBoundary>
  );
}
