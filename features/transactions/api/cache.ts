import type { InfiniteData } from "@tanstack/react-query";

import type {
  TransactionDto,
  TransactionFilters,
  TransactionListQuery,
  TransactionPage,
} from "@/schemas/transaction";

// Pure updates of a cached list, for optimistic changes. They only need to
// look right until the refetch after the mutation brings the server's truth,
// but they follow the list's filters and order, so a filtered list does not
// show a row it would never contain.

type Sorting = Pick<TransactionListQuery, "sort" | "order">;

/** What a cached list holds: one page (desktop) or the loaded pages (phone). */
export type CachedList = TransactionPage | InfiniteData<TransactionPage>;

/** The API's filters (transactions-repo.ts), checked on one row. */
export function matchesFilters(
  transaction: TransactionDto,
  filters: TransactionFilters,
): boolean {
  const { q, type, category, from, to } = filters;
  if (q) {
    const needle = q.toLowerCase();
    const found = [transaction.note ?? "", transaction.category.name].some(
      (text) => text.toLowerCase().includes(needle),
    );
    if (!found) return false;
  }
  if (type && transaction.type !== type) return false;
  if (category && transaction.category.id !== category) return false;
  if (from && transaction.date < from) return false;
  if (to && transaction.date > to) return false;
  return true;
}

/** The API's order, with the same tie-breakers (transactions-repo.ts). */
function compareTransactions({ sort, order }: Sorting) {
  const sign = order === "asc" ? 1 : -1;
  return (a: TransactionDto, b: TransactionDto) => {
    if (sort === "amount") {
      return (
        sign * (a.amount - b.amount) ||
        b.date.localeCompare(a.date) ||
        b.createdAt.localeCompare(a.createdAt) ||
        b.id.localeCompare(a.id)
      );
    }
    return (
      sign *
      (a.date.localeCompare(b.date) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id))
    );
  };
}

export function sortTransactions(
  list: TransactionDto[],
  sorting: Sorting,
): TransactionDto[] {
  return [...list].sort(compareTransactions(sorting));
}

/**
 * A new transaction, if the list's filters let it in: placed on the first
 * page in the list's order (keeping the page size); later pages cannot know
 * where it lands, so they only count it.
 */
export function insertTransaction(
  page: TransactionPage,
  transaction: TransactionDto,
  query: TransactionListQuery,
): TransactionPage {
  if (!matchesFilters(transaction, query)) return page;
  const total = page.total + 1;
  if (page.page !== 1) return { ...page, total };
  const data = sortTransactions([transaction, ...page.data], query).slice(
    0,
    page.pageSize,
  );
  return { ...page, data, total };
}

/**
 * An edited transaction, re-sorted in case its date or amount changed, or
 * dropped when it no longer matches the list's filters.
 */
export function replaceTransaction(
  page: TransactionPage,
  transaction: TransactionDto,
  query: TransactionListQuery,
): TransactionPage {
  if (!page.data.some((t) => t.id === transaction.id)) return page;
  if (!matchesFilters(transaction, query)) {
    return removeTransaction(page, transaction.id);
  }
  const data = sortTransactions(
    page.data.map((t) => (t.id === transaction.id ? transaction : t)),
    query,
  );
  return { ...page, data };
}

/** A deleted transaction, if this page shows it. */
export function removeTransaction(
  page: TransactionPage,
  id: string,
): TransactionPage {
  if (!page.data.some((t) => t.id === id)) return page;
  return {
    ...page,
    data: page.data.filter((t) => t.id !== id),
    total: page.total - 1,
  };
}

/**
 * Applies a page update to a cached list of either shape. The loaded pages of
 * the phone list are updated as one list, so a new row is not cut off at the
 * page size and every page keeps the same total; the page numbers stay, so
 * loading more and refetching still ask for the right pages.
 */
export function updateCachedList(
  list: CachedList | undefined,
  update: (page: TransactionPage) => TransactionPage,
): CachedList | undefined {
  if (!list) return list;
  if (!("pages" in list)) return update(list);

  const [first] = list.pages;
  if (!first) return list;
  const merged = update({
    ...first,
    data: list.pages.flatMap((p) => p.data),
    page: 1,
    pageSize: Number.MAX_SAFE_INTEGER,
  });

  let start = 0;
  const pages = list.pages.map((p, index) => {
    const last = index === list.pages.length - 1;
    const end = last ? merged.data.length : start + p.data.length;
    const data = merged.data.slice(start, end);
    start = end;
    return { ...p, data, total: merged.total };
  });
  return { ...list, pages };
}
