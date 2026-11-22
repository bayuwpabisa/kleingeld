"use client";

import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionSummary } from "@/features/transactions/api/use-transaction-summary";
import { summaryLayout } from "@/features/transactions/summary-layout";
import { cn } from "@/lib/cn";
import type { TransactionSummary } from "@/schemas/transaction";

import { balanceSize } from "../balance-size";
import { currentMonthFilters } from "../dashboard-queries";

/**
 * This month's Saldo, Pemasukan and Pengeluaran (wireframe 03, DESIGN.md
 * Kartu ringkasan). The page hands the server's numbers to the query cache,
 * so they show at once; after any change to the transactions they load
 * again with every other transaction query.
 */
export function MonthSummary({ today }: { today: string }) {
  const { data, isError, isFetching, refetch } = useTransactionSummary(
    currentMonthFilters(today),
  );

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

  return <MonthSummaryCards summary={data} busy={isFetching} />;
}

/** The same cards while the numbers load, for the page's Suspense fallback. */
export function MonthSummarySkeleton() {
  return <MonthSummaryCards summary={undefined} busy />;
}

/**
 * One layout for every width, so the server's HTML fits them all: on phones
 * one filled balance card with Pemasukan and Pengeluaran inside (wireframe
 * mobile 03), from lg three cards side by side. The DOM order is the same,
 * so the reading order is too.
 */
function MonthSummaryCards({
  summary,
  busy,
}: {
  summary: TransactionSummary | undefined;
  busy: boolean;
}) {
  // One size for Pemasukan and Pengeluaran, from the longer total
  // (summaryLayout); the balance is never longer than that.
  const largest = summary
    ? Math.max(summary.income.total, summary.expense.total)
    : 0;
  const layout = summaryLayout(largest);

  return (
    <section
      aria-labelledby="ringkasan-bulan-ini"
      aria-busy={busy}
      className={cn(
        layout.grid,
        "rounded-xl border border-border bg-surface-muted p-4",
        "lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
      )}
    >
      <h2 id="ringkasan-bulan-ini" className="sr-only">
        Ringkasan bulan ini
      </h2>
      <SummaryItem
        label={
          <>
            Saldo<span className="lg:hidden"> bulan ini</span>
          </>
        }
        amount={summary?.balance}
        amountClass={cn("h-9 lg:h-8", balanceSize(largest))}
        note="pemasukan − pengeluaran"
        // The phone card already says "bulan ini" in the label.
        noteClass="hidden lg:block"
        className="col-span-full lg:col-span-1"
      />
      <SummaryItem
        label="Pemasukan"
        amount={summary?.income.total}
        amountClass={cn("h-7 lg:h-8", layout.amount)}
        note={
          summary &&
          (summary.income.count === 0
            ? "Belum ada pemasukan bulan ini"
            : `${summary.income.count} transaksi`)
        }
      />
      <SummaryItem
        label="Pengeluaran"
        amount={summary?.expense.total}
        amountClass={cn("h-7 lg:h-8", layout.amount)}
        note={summary && `${summary.expense.count} transaksi`}
      />
    </section>
  );
}

function SummaryItem({
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
  // On phones a part of the filled card, from lg a card of its own (the
  // same border, radius and padding as Card). min-w-0: a long amount must
  // not widen its column. The amount's row has a fixed height and the
  // skeleton the same, so nothing moves when the numbers arrive.
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
