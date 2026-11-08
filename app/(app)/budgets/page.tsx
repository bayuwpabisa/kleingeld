import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Budget" };

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Budget" description="Batas bulanan per kategori." />
      <PagePlaceholder>
        Budget per kategori dan peringatan saat hampir habis akan tampil di
        sini.
      </PagePlaceholder>
    </>
  );
}
