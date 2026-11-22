import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { prefetchMonthSummary } from "../server/prefetch-dashboard";
import { MonthSummary } from "./month-summary";

/**
 * Server Component: reads this month's summary for the signed-in user and
 * hands it to MonthSummary through the query cache. It reads the request
 * (the session), so render it inside <Suspense>; the page streams it in as
 * soon as the numbers are ready. "Today" is read after the session, when
 * the render is already per request.
 */
export async function MonthSummarySection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchMonthSummary(db, user.id, today);

  return (
    <HydrationBoundary state={state}>
      <MonthSummary today={today} />
    </HydrationBoundary>
  );
}
