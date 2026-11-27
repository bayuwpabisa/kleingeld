import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { prefetchBudgets } from "@/features/budgets/server/prefetch-budgets";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { BudgetOverview } from "./budget-overview";

/**
 * Server Component: reads this month's budgets for the signed-in user (the
 * Budget page's prefetch, same key) and hands them to BudgetOverview through
 * the query cache. Render it inside <Suspense> with BudgetOverviewSkeleton.
 */
export async function BudgetOverviewSection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchBudgets(db, user.id, today);

  return (
    <HydrationBoundary state={state}>
      <BudgetOverview today={today} />
    </HydrationBoundary>
  );
}
