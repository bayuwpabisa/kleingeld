"use client";

import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { TransactionFilters } from "@/schemas/transaction";

import { useTransactionSummary } from "../api/use-transaction-summary";
import { periodLabel } from "../periods";
import { summaryLayout } from "../summary-layout";

/**
 * Pemasukan, Pengeluaran and Saldo of the filtered transactions (wireframe
 * 04, DESIGN.md Kartu ringkasan). Phones show the first two, as in the
 * wireframe. A failed load stays small here, so the list below still shows.
 */
export function TransactionSummary({
  filters,
}: {
  filters: TransactionFilters;
}) {
  const { data, isError, isFetching, isPlaceholderData, refetch } =
    useTransactionSummary(filters);

  if (!data && isError) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p role="alert" className="flex items-center gap-2">
          <CircleAlert
            aria-hidden
            className="size-5 shrink-0 text-danger"
            strokeWidth={1.75}
          />
          Ringkasan gagal dimuat.
        </p>
        <Button
          variant="secondary"
          size="sm"
          busy={isFetching}
          onClick={() => refetch()}
        >
          Coba lagi
        </Button>
      </Card>
    );
  }

  // One size for every card, from the longest total (the skeleton uses the
  // short layout). See summaryLayout for the measured tiers.
  const layout = summaryLayout(
    data ? Math.max(data.income.total, data.expense.total) : 0,
  );

  return (
    <section
      aria-labelledby="ringkasan-transaksi"
      aria-busy={isFetching}
      className={cn(
        layout.grid,
        "transition-opacity",
        isPlaceholderData && "opacity-60",
      )}
    >
      <h2 id="ringkasan-transaksi" className="sr-only">
        Ringkasan
      </h2>
      <SummaryCard
        label="Pemasukan"
        amount={data?.income.total}
        amountClass={layout.amount}
        note={data && `${data.income.count} transaksi`}
      />
      <SummaryCard
        label="Pengeluaran"
        amount={data?.expense.total}
        amountClass={layout.amount}
        note={data && `${data.expense.count} transaksi`}
      />
      <SummaryCard
        label="Saldo"
        amount={data?.balance}
        amountClass={layout.amount}
        note={data && periodLabel(filters)}
        className="hidden lg:block"
      />
    </section>
  );
}

function SummaryCard({
  label,
  amount,
  amountClass,
  note,
  className,
}: {
  label: string;
  amount: number | undefined;
  amountClass: string;
  note: ReactNode;
  className?: string;
}) {
  // min-w-0: a long amount must not widen its grid column past the page.
  // The amount's row is 28/32px high at every size, and the skeleton has the
  // same height, so nothing moves when the data arrives. A fixed height, not
  // a fixed line height: the small "Rp" would inherit a px line height and
  // make the row 2px taller.
  return (
    <Card className={cn("min-w-0", className)}>
      <p className="text-sm text-fg-muted">{label}</p>
      {amount === undefined ? (
        <>
          <Skeleton className="mt-1 h-7 w-3/4 lg:h-8" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </>
      ) : (
        <>
          <Money
            amount={amount}
            className={cn("mt-1 flex h-7 items-center lg:h-8", amountClass)}
          />
          <p className="mt-1 text-sm text-fg-muted">{note}</p>
        </>
      )}
    </Card>
  );
}
