import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { PagePlaceholder } from "@/components/app-shell/page-placeholder";
import { ThemePicker } from "@/components/theme/theme-picker";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  UserCard,
  UserCardSkeleton,
} from "@/features/auth/components/user-card";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Kategori, tampilan, dan akun."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <PagePlaceholder>Daftar kategori akan tampil di sini.</PagePlaceholder>
        <div className="flex flex-col gap-6">
          <Card
            as="section"
            aria-labelledby="profil"
            className="flex flex-col gap-4"
          >
            <h2 id="profil" className="text-lg font-semibold">
              Profil
            </h2>
            <Suspense fallback={<UserCardSkeleton size="lg" />}>
              <UserCard size="lg" />
            </Suspense>
          </Card>
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
          {/* Phones have no sidebar, so signing out lives here too. */}
          <Card
            as="section"
            aria-labelledby="akun"
            className="flex flex-col gap-4"
          >
            <h2 id="akun" className="text-lg font-semibold">
              Akun
            </h2>
            <SignOutButton />
          </Card>
        </div>
      </div>
    </>
  );
}
