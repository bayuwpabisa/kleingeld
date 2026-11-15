import type { Metadata } from "next";

import { BackLink } from "@/components/app-shell/back-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { NewTransactionScreen } from "@/features/transactions/components/new-transaction-screen";

export const metadata: Metadata = { title: "Tambah transaksi" };

/** The add form as a page, for phones (desktop opens a dialog instead). */
export default function NewTransactionPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href="/transactions" label="Transaksi" />
        <PageHeader
          title="Tambah transaksi"
          description="Catat pemasukan atau pengeluaran."
        />
      </div>
      <div className="w-full max-w-xl">
        <NewTransactionScreen />
      </div>
    </>
  );
}
