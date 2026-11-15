import type { TransactionDto, TransactionPage } from "@/schemas/transaction";

// Pure updates of a cached page, for optimistic changes. They only need to
// look right until the refetch after the mutation brings the server's truth.

/** The API's order: newest date first, then the newest entry, then id. */
export function sortTransactions(list: TransactionDto[]): TransactionDto[] {
  return [...list].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

/**
 * A new transaction: placed on the first page in date order (keeping the
 * page size); later pages cannot know where it lands, so they only count it.
 */
export function insertTransaction(
  page: TransactionPage,
  transaction: TransactionDto,
): TransactionPage {
  const total = page.total + 1;
  if (page.page !== 1) return { ...page, total };
  const data = sortTransactions([transaction, ...page.data]).slice(
    0,
    page.pageSize,
  );
  return { ...page, data, total };
}

/** An edited transaction, re-sorted in case its date changed. */
export function replaceTransaction(
  page: TransactionPage,
  transaction: TransactionDto,
): TransactionPage {
  if (!page.data.some((t) => t.id === transaction.id)) return page;
  const data = sortTransactions(
    page.data.map((t) => (t.id === transaction.id ? transaction : t)),
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
