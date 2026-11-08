import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Tambah transaksi" };

export default function NewTransactionPage() {
  return (
    <>
      <PageHeader
        title="Tambah transaksi"
        description="Catat pemasukan atau pengeluaran."
      />
      <PagePlaceholder>
        Form tambah transaksi akan tampil di sini.
      </PagePlaceholder>
    </>
  );
}
