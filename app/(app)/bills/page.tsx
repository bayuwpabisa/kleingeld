import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Tagihan" };

export default function BillsPage() {
  return (
    <>
      <PageHeader title="Tagihan" description="Tagihan rutin dan cicilan." />
      <PagePlaceholder>
        Tagihan, cicilan, dan jatuh tempo berikutnya akan tampil di sini.
      </PagePlaceholder>
    </>
  );
}
