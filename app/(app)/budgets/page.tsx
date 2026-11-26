import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/app-shell/page-header";
import { BudgetsSkeleton } from "@/features/budgets/components/budgets";
import { BudgetsSection } from "@/features/budgets/components/budgets-section";

export const metadata: Metadata = { title: "Budget" };

/**
 * The header is prerendered; the budgets read the user's data on the server
 * and stream in behind a skeleton of the same shape.
 */
export default function BudgetsPage() {
  return (
    <>
      <PageHeader
        title="Budget"
        description="Batas pengeluaran per kategori bulan ini."
      />
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsSection />
      </Suspense>
    </>
  );
}
