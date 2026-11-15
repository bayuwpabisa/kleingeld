import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { categoryKeys } from "@/features/categories/api/use-categories";
import { ApiError } from "@/lib/api/client";
import type { ToastOptions } from "@/lib/store/toast-slice";
import type { CategoryDto } from "@/schemas/category";
import type {
  TransactionDto,
  TransactionInput,
  TransactionPage,
} from "@/schemas/transaction";

import { transactionKeys } from "./keys";

// Shared steps of the optimistic mutations: stop list refetches, remember the
// cache, change it, and put it back if the server says no.

export type ListSnapshot = [QueryKey, TransactionPage | undefined][];

export async function snapshotLists(
  queryClient: QueryClient,
): Promise<ListSnapshot> {
  // A refetch landing now would overwrite the optimistic change.
  await queryClient.cancelQueries({ queryKey: transactionKeys.lists() });
  return queryClient.getQueriesData<TransactionPage>({
    queryKey: transactionKeys.lists(),
  });
}

export function restoreLists(queryClient: QueryClient, snapshot: ListSnapshot) {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}

export function updateLists(
  queryClient: QueryClient,
  update: (page: TransactionPage) => TransactionPage,
) {
  queryClient.setQueriesData<TransactionPage>(
    { queryKey: transactionKeys.lists() },
    (page) => (page ? update(page) : page),
  );
}

/** A transaction from any cached list or detail, for edits and undo. */
export function findCachedTransaction(
  queryClient: QueryClient,
  id: string,
): TransactionDto | undefined {
  const detail = queryClient.getQueryData<TransactionDto>(
    transactionKeys.detail(id),
  );
  if (detail) return detail;
  for (const [, page] of queryClient.getQueriesData<TransactionPage>({
    queryKey: transactionKeys.lists(),
  })) {
    const found = page?.data.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

/** How a transaction in the cache shows its category, from the categories. */
export function cachedCategory(
  queryClient: QueryClient,
  categoryId: string,
): TransactionDto["category"] {
  const category = queryClient
    .getQueryData<CategoryDto[]>(categoryKeys.all)
    ?.find((c) => c.id === categoryId);
  return category
    ? { id: category.id, name: category.name, icon: category.icon }
    : { id: categoryId, name: "", icon: "tag" };
}

/** The fields to send again to recreate a transaction (Urungkan). */
export function toInput(transaction: TransactionDto): TransactionInput {
  return {
    type: transaction.type,
    categoryId: transaction.category.id,
    amount: transaction.amount,
    date: transaction.date,
    note: transaction.note,
  };
}

/**
 * The toast after a failed write. A refusal by the server (4xx) says why and
 * has no retry, since the same request would fail again; a network or server
 * failure offers "Coba lagi".
 */
export function failureToast(
  action: "disimpan" | "dihapus",
  error: unknown,
  retry: () => void,
): ToastOptions {
  const base = `Transaksi gagal ${action}.`;
  if (error instanceof ApiError && error.status < 500) {
    const reason =
      Object.values(error.fieldErrors).flat()[0] ??
      error.formErrors[0] ??
      error.message;
    return { message: `${base} ${reason}` };
  }
  return {
    message: `${base} Periksa koneksi lalu coba lagi.`,
    action: { label: "Coba lagi", onClick: retry },
  };
}
