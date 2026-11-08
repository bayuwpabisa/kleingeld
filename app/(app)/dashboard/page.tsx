import type { Metadata } from "next";
import { AddTransactionLink } from "@/components/app-shell/add-transaction-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan keuanganmu bulan ini."
        actions={<AddTransactionLink />}
      />
      <PagePlaceholder>
        Saldo, grafik, budget, dan tagihan terdekat akan tampil di sini.
      </PagePlaceholder>
    </>
  );
}
