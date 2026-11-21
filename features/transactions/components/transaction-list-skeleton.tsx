import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 8;

/**
 * Loading placeholder with the same shape and size as the table (wide
 * screens) and the day groups (phones), so nothing jumps when data arrives.
 */
export function TransactionListSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat transaksi…
      </p>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
        <div className="flex h-11 items-center gap-10 px-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        {Array.from({ length: ROWS }, (_, row) => (
          <div
            key={row}
            className="flex h-14 items-center gap-10 border-t border-border px-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex items-center gap-3 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}
