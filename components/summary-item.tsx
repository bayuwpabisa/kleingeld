import type { ReactNode } from "react";

import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * One labelled amount of a summary (DESIGN.md › Kartu ringkasan dashboard):
 * on phones a part of one filled card, from lg a card of its own (the same
 * border, radius and padding as Card). Used by the dashboard's month summary
 * and the Budget page. Without an amount it is its own skeleton.
 */
export function SummaryItem({
  label,
  amount,
  amountClass,
  note,
  noteClass,
  className,
}: {
  label: ReactNode;
  amount: number | undefined;
  /** Font size and the fixed height of the amount's row. */
  amountClass: string;
  note: ReactNode;
  noteClass?: string;
  className?: string;
}) {
  // min-w-0: a long amount must not widen its column. The amount's row has
  // a fixed height and the skeleton the same, so nothing moves when the
  // numbers arrive.
  return (
    <div
      className={cn(
        "min-w-0 lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-6",
        className,
      )}
    >
      <p className="text-sm text-fg-muted">{label}</p>
      {amount === undefined ? (
        <>
          <Skeleton className={cn("mt-1 w-3/4", amountClass)} />
          <div className={noteClass}>
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        </>
      ) : (
        <>
          <Money
            amount={amount}
            className={cn("mt-1 flex items-center", amountClass)}
          />
          <div className={noteClass}>
            <p className="mt-1 text-sm text-fg-muted">{note}</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The frame of such a summary: one filled card on phones, from lg the items
 * side by side as cards. `grid` comes from summaryLayout
 * (features/transactions/summary-layout.ts).
 */
export const summaryFrameClasses = cn(
  "rounded-xl border border-border bg-surface-muted p-4",
  "lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
);
