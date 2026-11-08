import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Kategori, tampilan, dan akun."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <PagePlaceholder>
          Daftar kategori, profil, dan tombol keluar akun akan tampil di sini.
        </PagePlaceholder>
        <Card
          as="section"
          aria-labelledby="tampilan"
          className="flex flex-col gap-4"
        >
          <h2 id="tampilan" className="text-lg font-semibold">
            Tampilan
          </h2>
          <ThemePicker />
        </Card>
      </div>
    </>
  );
}
