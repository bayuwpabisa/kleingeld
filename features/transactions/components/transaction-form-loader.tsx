"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useCategories } from "@/features/categories/api/use-categories";
import type { TransactionDto, TransactionInput } from "@/schemas/transaction";

import { TransactionForm } from "./transaction-form";

type TransactionFormLoaderProps = {
  /** For editing: the transaction, once loaded. */
  transaction?: TransactionDto;
  onSubmit: (values: TransactionInput) => void;
  onCancel?: () => void;
  onDelete?: () => void;
};

/**
 * The form once the user's categories are there: a skeleton while they load,
 * an error with retry if they fail. Shared by the dialog and the pages.
 */
export function TransactionFormLoader(props: TransactionFormLoaderProps) {
  const categories = useCategories();

  if (categories.data) {
    return <TransactionForm categories={categories.data} {...props} />;
  }
  if (categories.isError) {
    return (
      <ErrorState
        message="Kategori gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => categories.refetch()}
        retrying={categories.isFetching}
      />
    );
  }
  return <TransactionFormSkeleton />;
}

/** The form's shape while its data loads. */
export function TransactionFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <p role="status" className="sr-only">
        Memuat formulir…
      </p>
      <Skeleton className="h-11 rounded-full" />
      <Skeleton className="h-14" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-28" />
    </div>
  );
}
