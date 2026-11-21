import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** "‹ Transaksi" above a sub-page's title: back to the section it belongs to. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-lg px-1 text-sm text-fg-muted hover:text-fg lg:min-h-8"
    >
      <ChevronLeft aria-hidden className="size-5" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
