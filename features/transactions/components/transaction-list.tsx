"use client";

import type { FetchStatus } from "@tanstack/react-query";
import { Plus, ReceiptText, SearchX, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { useCategories } from "@/features/categories/api/use-categories";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import type { TransactionListQuery } from "@/schemas/transaction";

import { useInfiniteTransactions } from "../api/use-infinite-transactions";
import { useTransactions } from "../api/use-transactions";
import { describeEmptyFilter } from "../describe-empty-filter";
import { filtersOf, hasActiveFilters } from "../list-query-url";
import { useListQuery } from "../use-list-query";
import { TransactionGroups } from "./transaction-groups";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { TransactionSummary } from "./transaction-summary";
import { TransactionTable } from "./transaction-table";
import { TransactionToolbar } from "./transaction-toolbar";

/** Tailwind `lg`: the table with pages from here, the day list below. */
const DESKTOP = "(min-width: 1024px)";

type ListControls = ReturnType<typeof useListQuery>;

/**
 * The transactions page: toolbar, summary and the list, all driven by the
 * URL (useListQuery). Desktop pages through a table; phones load more rows
 * into the day list. Only the list for the current width is mounted, so only
 * its query runs. Must sit inside <Suspense> (it reads the URL).
 *
 * Every state of DESIGN.md is here: skeleton, error with retry, offline,
 * first use, nothing found for the filters, and the list itself. A failed
 * refetch while data is shown is reported by a toast (lib/query-client.ts).
 */
export function TransactionList() {
  const listQuery = useListQuery();
  const categories = useCategories();
  const isDesktop = useMediaQuery(DESKTOP);
  const { query } = listQuery;

  // "Hapus filter" starts the toolbar afresh (a new key), which also closes
  // date fields opened without a date. The button disappears with the empty
  // state, so the focus moves to the search box instead of being lost.
  const [resets, setResets] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (resets > 0) searchRef.current?.focus();
  }, [resets]);
  const controls: ListControls = {
    ...listQuery,
    clearFilters: () => {
      listQuery.clearFilters();
      setResets((count) => count + 1);
    },
  };

  // undefined while the categories load; null when the URL names a category
  // the user does not have.
  const categoryName = categories.data
    ? (categories.data.find((c) => c.id === query.category)?.name ?? null)
    : undefined;
  const emptyMessage = describeEmptyFilter(query, categoryName);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <TransactionToolbar
        key={resets}
        searchRef={searchRef}
        query={query}
        categories={categories.data}
        setFilters={controls.setFilters}
        setSort={controls.setSort}
      />
      <TransactionSummary filters={filtersOf(query)} />
      {isDesktop === null ? (
        // The width is not known before hydration.
        <TransactionListSkeleton />
      ) : isDesktop ? (
        <DesktopList controls={controls} emptyMessage={emptyMessage} />
      ) : (
        <PhoneList controls={controls} emptyMessage={emptyMessage} />
      )}
    </div>
  );
}

type ListProps = { controls: ListControls; emptyMessage: string };

function DesktopList({ controls, emptyMessage }: ListProps) {
  const { query, setPage, setSort } = controls;
  const result = useTransactions(query);
  const { data, isPlaceholderData } = result;
  const pageCount = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;
  const pastTheEnd =
    data !== undefined && !isPlaceholderData && query.page > pageCount;

  // An old link, or the last row of the last page deleted: show the last
  // page that exists instead of an empty one.
  useEffect(() => {
    if (pastTheEnd) setPage(pageCount, { replace: true });
  }, [pastTheEnd, pageCount, setPage]);

  const first = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const last = data ? first + data.data.length - 1 : 0;

  return (
    <ListState
      query={query}
      total={data?.total}
      shown={data !== undefined && !pastTheEnd}
      isError={result.isError}
      isFetching={result.isFetching}
      isPlaceholderData={isPlaceholderData}
      fetchStatus={result.fetchStatus}
      onRetry={() => result.refetch()}
      onClearFilters={controls.clearFilters}
      emptyMessage={emptyMessage}
    >
      {data && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <TransactionTable
            transactions={data.data}
            sorting={{ sort: query.sort, order: query.order }}
            onSort={setSort}
          />
          <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
            <p className="text-sm text-fg-muted">
              Menampilkan {first}–{last} dari {data.total} transaksi
            </p>
            <Pagination
              page={data.page}
              pageCount={pageCount}
              onPageChange={(page) => setPage(page)}
            />
          </div>
        </div>
      )}
    </ListState>
  );
}

function PhoneList({ controls, emptyMessage }: ListProps) {
  const { query } = controls;
  const result = useInfiniteTransactions({
    ...filtersOf(query),
    sort: query.sort,
    order: query.order,
    pageSize: query.pageSize,
  });
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = result;
  const rows = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages.at(-1)?.total;

  return (
    <ListState
      query={query}
      total={total}
      shown={data !== undefined}
      isError={result.isError}
      isFetching={result.isFetching && !isFetchingNextPage}
      isPlaceholderData={result.isPlaceholderData}
      fetchStatus={result.fetchStatus}
      onRetry={() => result.refetch()}
      onClearFilters={controls.clearFilters}
      emptyMessage={emptyMessage}
    >
      <TransactionGroups transactions={rows} />
      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-sm text-fg-muted">
          Menampilkan {rows.length} dari {total} transaksi
        </p>
        {hasNextPage && (
          <Button
            variant="secondary"
            className="w-full"
            busy={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Muat lebih banyak
          </Button>
        )}
      </div>
    </ListState>
  );
}

/**
 * What both lists show around their rows: the loading, error, offline and
 * empty states, and a live region that tells screen reader users how many
 * transactions the filters found.
 */
function ListState({
  query,
  total,
  shown,
  isError,
  isFetching,
  isPlaceholderData,
  fetchStatus,
  onRetry,
  onClearFilters,
  emptyMessage,
  children,
}: {
  query: TransactionListQuery;
  total: number | undefined;
  /** The data is there and may be drawn. */
  shown: boolean;
  isError: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  fetchStatus: FetchStatus;
  onRetry: () => void;
  onClearFilters: () => void;
  emptyMessage: string;
  children: ReactNode;
}) {
  const filtered = hasActiveFilters(query);
  const announcement =
    filtered && total !== undefined && !isPlaceholderData
      ? `${total} transaksi ditemukan`
      : "";

  return (
    <div
      data-testid="transaction-list"
      aria-busy={isFetching}
      className={cn("transition-opacity", isPlaceholderData && "opacity-60")}
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {shown && total !== undefined ? (
        total > 0 ? (
          children
        ) : filtered ? (
          <EmptyState
            icon={SearchX}
            message={emptyMessage}
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                Hapus filter
              </Button>
            }
          />
        ) : (
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
        )
      ) : isError ? (
        <ErrorState
          message="Transaksi gagal dimuat. Periksa koneksi lalu coba lagi."
          onRetry={onRetry}
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
