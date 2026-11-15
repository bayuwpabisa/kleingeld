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

  return (
    <section
      aria-labelledby="ringkasan-transaksi"
      aria-busy={isFetching}
      className={cn(
        "grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-3 lg:gap-4",
        isPlaceholderData && "opacity-60",
      )}
    >
      <h2 id="ringkasan-transaksi" className="sr-only">
        Ringkasan
      </h2>
      <SummaryCard
        label="Pemasukan"
        amount={data?.income.total}
        note={data && `${data.income.count} transaksi`}
      />
      <SummaryCard
        label="Pengeluaran"
        amount={data?.expense.total}
        note={data && `${data.expense.count} transaksi`}
      />
      <SummaryCard
        label="Saldo"
        amount={data?.balance}
        note={data && periodLabel(filters)}
        className="hidden lg:block"
      />
    </section>
  );
}

function SummaryCard({
  label,
  amount,
  note,
  className,
}: {
  label: string;
  amount: number | undefined;
  note: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <p className="text-sm text-fg-muted">{label}</p>
      {amount === undefined ? (
        <>
          <Skeleton className="mt-2 h-7 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </>
      ) : (
        <>
          <Money amount={amount} className="mt-1 block text-xl lg:text-2xl" />
          <p className="mt-1 text-sm text-fg-muted">{note}</p>
        </>
      )}
    </Card>
  );
}
