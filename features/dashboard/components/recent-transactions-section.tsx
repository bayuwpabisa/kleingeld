import { HydrationBoundary } from "@tanstack/react-query";

import { db } from "@/db";
import { todayInJakarta } from "@/lib/date";
import { requireUser } from "@/lib/session";

import { prefetchRecentTransactions } from "../server/prefetch-dashboard";
import { RecentTransactions } from "./recent-transactions";

/**
 * Server Component: reads the five newest transactions for the signed-in
 * user and hands them to RecentTransactions through the query cache. Render
 * it inside <Suspense>; it streams in on its own, next to the summary (the
 * session is read once per request, lib/session.ts).
 */
export async function RecentTransactionsSection() {
  const user = await requireUser();
  const today = todayInJakarta();
  const state = await prefetchRecentTransactions(db, user.id);

  return (
    <HydrationBoundary state={state}>
      <RecentTransactions today={today} />
    </HydrationBoundary>
  );
}
