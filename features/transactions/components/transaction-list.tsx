"use client";

import { Plus, ReceiptText, WifiOff } from "lucide-react";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DEFAULT_PAGE_SIZE, type TransactionPage } from "@/schemas/transaction";

import { useTransactions } from "../api/use-transactions";
import { TransactionGroups } from "./transaction-groups";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { TransactionTable } from "./transaction-table";

// Search, filters, sorting and pages move into the URL on 14 Nov; until
// then the list shows the newest page.
const FIRST_PAGE = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

/**
 * The user's transactions from the API, with every state of DESIGN.md:
 * skeleton, error with retry, offline, first use, and the list itself.
 * A failed refetch while data is shown is reported by a toast
 * (lib/query-client.ts), and the data stays.
 */
export function TransactionList() {
  const { data, isError, isFetching, fetchStatus, refetch } =
    useTransactions(FIRST_PAGE);

  return (
    <div data-testid="transaction-list" aria-busy={isFetching}>
      {data ? (
        <Loaded page={data} />
      ) : isError ? (
        <ErrorState
          message="Transaksi gagal dimuat. Periksa koneksi lalu coba lagi."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : fetchStatus === "paused" ? (
        // TanStack Query waits for the connection instead of failing.
        <EmptyState
          icon={WifiOff}
          message="Kamu sedang offline. Transaksi dimuat otomatis saat koneksi kembali."
        />
      ) : (
        <TransactionListSkeleton />
      )}
    </div>
  );
}

function Loaded({ page }: { page: TransactionPage }) {
  if (page.total === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        message="Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi."
        action={
          <Link href="/transactions/new" className={buttonClasses()}>
            <Plus aria-hidden className="size-5" strokeWidth={1.75} />
            Tambah transaksi
          </Link>
        }
      />
    );
  }

  const first = (page.page - 1) * page.pageSize + 1;
  const last = first + page.data.length - 1;
  const summary = `Menampilkan ${first}–${last} dari ${page.total} transaksi`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
        <TransactionTable transactions={page.data} />
        <p className="border-t border-border px-5 py-4 text-sm text-fg-muted">
          {summary}
        </p>
      </div>
      <div className="lg:hidden">
        <TransactionGroups transactions={page.data} />
        <p className="mt-4 text-center text-sm text-fg-muted">{summary}</p>
      </div>
    </>
  );
}
