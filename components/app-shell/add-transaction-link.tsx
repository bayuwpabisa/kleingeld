import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/**
 * "Tambah transaksi" in the page header, desktop only: phones use the add
 * button in the bottom nav. The wrapper hides it, because the link's own
 * `inline-flex` would clash with `hidden` (no tailwind-merge, see lib/cn.ts).
 */
export function AddTransactionLink() {
  return (
    <div className="hidden lg:flex">
      <Link href="/transactions/new" className={buttonClasses()}>
        <Plus aria-hidden className="size-5" strokeWidth={1.75} />
        Tambah transaksi
      </Link>
    </div>
  );
}
