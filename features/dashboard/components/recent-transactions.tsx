"use client";

import { Plus, ReceiptText, WifiOff } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/features/transactions/api/use-transactions";
import { TransactionRow } from "@/features/transactions/components/transaction-groups";
import { shortDate } from "@/lib/date";
import { useAppDispatch } from "@/lib/store/hooks";
import { editorOpened } from "@/lib/store/transaction-editor-slice";
import { DESKTOP_MEDIA } from "@/lib/use-media-query";

import { RECENT_QUERY } from "../dashboard-queries";

const HEADING_ID = "transaksi-terbaru";

/**
 * "Transaksi terbaru": the five newest transactions (wireframe 03). The page
 * hands the server's rows to the query cache, so they show at once; the
 * optimistic changes reach this list like any other (it is a list query).
 * `today` comes from the server, so the dates read the same on both sides.
 */
export function RecentTransactions({ today }: { today: string }) {
  const dispatch = useAppDispatch();
  const { data, isError, isFetching, fetchStatus, refetch } =
    useTransactions(RECENT_QUERY);

  // A row is a link to the edit page, which phones follow. On desktop the
  // form opens as a dialog over the dashboard instead, like everywhere
  // else. Checked on click, not while rendering, so the server's HTML is
  // the same at every width; a click with a modifier key stays the browser's.
  const openOnDesktop =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      const modified =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;
      if (modified || !window.matchMedia(DESKTOP_MEDIA).matches) return;
      event.preventDefault();
      dispatch(editorOpened({ mode: "edit", id }));
    };

  let content: ReactNode;
  if (data) {
    content =
      data.total === 0 ? (
        <EmptyState
          bare
          icon={ReceiptText}
          message="Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi."
          action={
            <Link href="/transactions/new" className={buttonClasses()}>
              <Plus aria-hidden className="size-5" strokeWidth={1.75} />
              Tambah transaksi
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {data.data.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              detail={`${shortDate(transaction.date, today)} · ${transaction.category.name}`}
              onClick={openOnDesktop(transaction.id)}
            />
          ))}
        </ul>
      );
  } else if (isError) {
    content = (
      <ErrorState
        bare
        message="Transaksi terbaru gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  } else if (fetchStatus === "paused") {
    // TanStack Query waits for the connection instead of failing.
    content = (
      <EmptyState
        bare
        icon={WifiOff}
        message="Kamu sedang offline. Transaksi dimuat otomatis saat koneksi kembali."
      />
    );
  } else {
    content = <RowsSkeleton />;
  }

  return (
    <RecentTransactionsFrame busy={isFetching}>
      {content}
    </RecentTransactionsFrame>
  );
}

/** The same card while the rows load, for the page's Suspense fallback. */
export function RecentTransactionsSkeleton() {
  return (
    <RecentTransactionsFrame busy>
      <RowsSkeleton />
    </RecentTransactionsFrame>
  );
}

function RecentTransactionsFrame({
  busy,
  children,
}: {
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <Card
      as="section"
      aria-labelledby={HEADING_ID}
      aria-busy={busy}
      className="flex min-w-0 flex-col gap-1"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={HEADING_ID} className="text-xl font-semibold">
          Transaksi terbaru
        </h2>
        <Link
          href="/transactions"
          className={buttonClasses({ variant: "quiet-primary", size: "sm" })}
        >
          Lihat semua
        </Link>
      </div>
      {children}
    </Card>
  );
}

/**
 * Five rows shaped like TransactionRow: 68px each, the title's 24px line and
 * the detail's 20px line plus the row's padding (measured in the browser).
 */
function RowsSkeleton() {
  return (
    <div aria-hidden className="divide-y divide-border">
      {Array.from({ length: RECENT_QUERY.pageSize }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
