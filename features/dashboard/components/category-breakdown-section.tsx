import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { prefetchMonthCategories } from "../server/prefetch-dashboard";
import { CategoryBreakdown } from "./category-breakdown";

/**
 * Server Component: reads this month's expense per category for the
 * signed-in user and hands it to CategoryBreakdown through the query cache.
 * Render it inside <Suspense>; it streams in on its own. "Today" is read
 * after the session, when the render is already per request.
 */
export async function CategoryBreakdownSection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchMonthCategories(db, user.id, today);

  return (
    <HydrationBoundary state={state}>
      <CategoryBreakdown today={today} />
    </HydrationBoundary>
  );
}
