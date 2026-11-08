import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/** Phone top bar (below lg): logo, and Pengaturan, which the bottom nav lacks. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-5 lg:hidden">
      <Link href="/dashboard" className="rounded-lg">
        <Logo />
      </Link>
      <Link
        href="/settings"
        aria-label="Pengaturan"
        className="-mr-2 flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
      >
        <Settings aria-hidden className="size-6" strokeWidth={1.75} />
      </Link>
    </header>
  );
}
