import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/app-shell/back-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { EditTransactionScreen } from "@/features/transactions/components/edit-transaction-screen";
import { TransactionFormSkeleton } from "@/features/transactions/components/transaction-form-loader";

export const metadata: Metadata = { title: "Ubah transaksi" };

/**
 * The edit form as a page, for phones (desktop opens a dialog instead).
 * The id is only known per request, so the screen that reads it waits in
 * Suspense while the rest of the page is prerendered (cacheComponents).
 */
export default function EditTransactionPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href="/transactions" label="Transaksi" />
        <PageHeader title="Ubah transaksi" />
      </div>
      <div className="w-full max-w-xl">
        <Suspense fallback={<TransactionFormSkeleton />}>
          <EditTransactionScreen />
        </Suspense>
      </div>
    </>
  );
}
