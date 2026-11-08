import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Kategori, tampilan, dan akun."
      />
      <PagePlaceholder>
        Kategori, mode warna, dan akun akan tampil di sini.
      </PagePlaceholder>
    </>
  );
}
