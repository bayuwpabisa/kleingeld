import type { Metadata } from "next";
import { Suspense } from "react";

import { AddTransactionButton } from "@/components/app-shell/add-transaction-button";
import { PageHeader } from "@/components/app-shell/page-header";
import { MonthSummarySkeleton } from "@/features/dashboard/components/month-summary";
import { MonthSummarySection } from "@/features/dashboard/components/month-summary-section";

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
    </>
  );
}
