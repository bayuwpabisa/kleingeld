import type { Metadata } from "next";
import { AddTransactionLink } from "@/components/app-shell/add-transaction-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Transaksi" };

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Semua pemasukan dan pengeluaranmu."
        actions={<AddTransactionLink />}
      />
      <PagePlaceholder>
        Daftar transaksi dengan cari, filter, dan urutan akan tampil di sini.
      </PagePlaceholder>
    </>
  );
}
