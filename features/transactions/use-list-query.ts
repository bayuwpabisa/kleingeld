"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type {
  SortOrder,
  TransactionFilters,
  TransactionListQuery,
  TransactionSort,
} from "@/schemas/transaction";

import {
  DEFAULT_LIST_QUERY,
  parseListQuery,
  toSearchParams,
} from "./list-query-url";

type NavigateOptions = {
  /** Replace the current history entry instead of adding one (typing). */
  replace?: boolean;
};

/**
 * The transactions list's query, kept in the page's URL so it survives a
 * reload and can be shared. Changes go through the browser's history API,
 * which Next.js syncs with `useSearchParams`, so changing a filter needs no
 * server request and does not scroll the page; Back returns to the previous
 * filters. Must sit inside <Suspense> (useSearchParams with Cache
 * Components).
 */
export function useListQuery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = useMemo(() => parseListQuery(searchParams), [searchParams]);

  const navigate = useCallback(
    (next: TransactionListQuery, { replace = false }: NavigateOptions = {}) => {
      const search = toSearchParams(next).toString();
      const url = search ? `${pathname}?${search}` : pathname;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname],
  );

  /** Narrows the list; any change of filter starts again at page 1. */
  const setFilters = useCallback(
    (filters: Partial<TransactionFilters>, options?: NavigateOptions) =>
      navigate({ ...query, ...filters, page: 1 }, options),
    [navigate, query],
  );

  const setSort = useCallback(
    (sorting: { sort: TransactionSort; order: SortOrder }) =>
      navigate({ ...query, ...sorting, page: 1 }),
    [navigate, query],
  );

  const setPage = useCallback(
    (page: number, options?: NavigateOptions) =>
      navigate({ ...query, page }, options),
    [navigate, query],
  );

  /** "Hapus filter": every filter off, the chosen order stays. */
  const clearFilters = useCallback(
    () =>
      navigate({
        ...DEFAULT_LIST_QUERY,
        sort: query.sort,
        order: query.order,
      }),
    [navigate, query],
  );

  return { query, setFilters, setSort, setPage, clearFilters };
}
