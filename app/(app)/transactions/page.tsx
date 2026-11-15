import type { Metadata } from "next";
import { Suspense } from "react";

import { AddTransactionButton } from "@/components/app-shell/add-transaction-button";
import { PageHeader } from "@/components/app-shell/page-header";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { TransactionListSkeleton } from "@/features/transactions/components/transaction-list-skeleton";

export const metadata: Metadata = { title: "Transaksi" };

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Semua pemasukan dan pengeluaranmu."
        actions={<AddTransactionButton />}
      />
      {/* The list reads its filters from the URL, which is only known in the
          browser; the header above stays prerendered. */}
      <Suspense fallback={<TransactionListSkeleton />}>
        <TransactionList />
      </Suspense>
    </>
  );
}
