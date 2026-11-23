import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { prefetchMonthlyTrend } from "../server/prefetch-dashboard";
import { MonthlyTrend } from "./monthly-trend";

/**
 * Server Component: reads six months of totals for the signed-in user and
 * hands them to MonthlyTrend through the query cache. Render it inside
 * <Suspense>; it streams in on its own. "Today" is read after the session,
 * when the render is already per request.
 */
export async function MonthlyTrendSection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchMonthlyTrend(db, user.id, today);

  return (
    <HydrationBoundary state={state}>
      <MonthlyTrend today={today} />
    </HydrationBoundary>
  );
}
