import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SkipLink } from "@/components/ui/skip-link";
import { RedirectIfSignedIn } from "@/features/auth/components/redirect-if-signed-in";
import { SignInOptions } from "@/features/auth/components/sign-in-options";
import { SignInOptionsFromUrl } from "@/features/auth/components/sign-in-options-from-url";

export const metadata: Metadata = { title: "Masuk" };

/**
 * Login (wireframe 02): a preview of the app on the left from lg up, the
 * sign-in options on the right. The page is static; the session check and
 * the URL's ?next= and ?error= are read inside Suspense boundaries.
 */
export default function LoginPage() {
  return (
    <>
      <SkipLink />
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="grid flex-1 lg:grid-cols-[3fr_2fr]">
        <aside className="hidden flex-col items-center justify-center gap-8 bg-surface-muted p-12 lg:flex">
          <div className="w-full max-w-xl">
            <DashboardPreview />
          </div>
          <p className="max-w-md text-center text-2xl font-semibold text-balance">
            Catat, pantau, dan kendalikan pengeluaran bulananmu.
          </p>
        </aside>
        <main
          id="konten"
          tabIndex={-1}
          className="flex flex-col justify-center px-5 py-12 outline-none lg:px-16"
        >
          <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
              <Link href="/" className="rounded-lg">
                <Logo />
              </Link>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-[-0.02em] text-balance">
                  Masuk ke Kleingeld
                </h1>
                <p className="text-fg-muted">
                  Pakai akun Google atau GitHub. Tidak perlu membuat password.
                </p>
              </div>
            </div>
            {/* The fallback works on its own, with the default ?next=. */}
            <Suspense fallback={<SignInOptions />}>
              <SignInOptionsFromUrl />
            </Suspense>
            <Link
              href="/"
              className="inline-flex items-center gap-2 self-center rounded text-sm text-fg-muted hover:text-fg lg:self-start"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Kembali ke beranda
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
