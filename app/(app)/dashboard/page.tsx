import type { Metadata } from "next";
import { Suspense } from "react";

import { AddTransactionButton } from "@/components/app-shell/add-transaction-button";
import { PageHeader } from "@/components/app-shell/page-header";
import { MonthSummarySkeleton } from "@/features/dashboard/components/month-summary";
import { MonthSummarySection } from "@/features/dashboard/components/month-summary-section";
import { MonthlyTrendSkeleton } from "@/features/dashboard/components/monthly-trend";
import { MonthlyTrendSection } from "@/features/dashboard/components/monthly-trend-section";
import { RecentTransactionsSkeleton } from "@/features/dashboard/components/recent-transactions";
import { RecentTransactionsSection } from "@/features/dashboard/components/recent-transactions-section";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The header is prerendered; each part below reads the user's data on the
 * server and streams in on its own, behind a skeleton of the same size.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan keuanganmu bulan ini."
        actions={<AddTransactionButton />}
      />
      <Suspense fallback={<MonthSummarySkeleton />}>
        <MonthSummarySection />
      </Suspense>
      {/* Charts: "Tren bulanan", then "Per kategori" (added next). */}
      <div className="grid grid-cols-1 gap-6 lg:gap-4">
        <Suspense fallback={<MonthlyTrendSkeleton />}>
          <MonthlyTrendSection />
        </Suspense>
      </div>
      {/* Budget and bills join this row later (wireframe 03). Three columns
          only from 1440px: below that a card is too narrow for its heading
          and "Lihat semua" on one line (measured at 1280px). Both column
          counts use arbitrary breakpoints on purpose: Tailwind puts those
          before the named ones (lg), so `lg:grid-cols-2` would win over
          `min-[1440px]:grid-cols-3` at every width. */}
      <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3 lg:gap-4">
        <Suspense fallback={<RecentTransactionsSkeleton />}>
          <RecentTransactionsSection />
        </Suspense>
      </div>
    </>
  );
}
