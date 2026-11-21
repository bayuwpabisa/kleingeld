"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/client";
import { useResetOnHide } from "@/lib/use-reset-on-hide";

import { useDeleteTransaction } from "../api/use-delete-transaction";
import { useTransaction } from "../api/use-transaction";
import { useUpdateTransaction } from "../api/use-update-transaction";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import {
  TransactionFormLoader,
  TransactionFormSkeleton,
} from "./transaction-form-loader";

/**
 * /transactions/[id]/edit, the edit form as a full page (phones, from a row
 * of the list). "Hapus transaksi" asks first in a bottom sheet. Both saving
 * and deleting go back to the list at once (optimistic).
 * The page wraps this in Suspense: useParams waits for the request there.
 */
export function EditTransactionScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const transaction = useTransaction(id);
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Next keeps a hidden page's state; the delete question must not be open
  // again when the user comes back to this transaction.
  useResetOnHide(() => setConfirmDelete(false));

  if (transaction.data) {
    return (
      <>
        <TransactionFormLoader
          transaction={transaction.data}
          onSubmit={(values) => {
            update.mutate({ id, values });
            router.push("/transactions");
          }}
          onDelete={() => setConfirmDelete(true)}
        />
        <DeleteTransactionDialog
          id={confirmDelete ? id : null}
          onClose={() => setConfirmDelete(false)}
          onConfirm={(deleteId) => {
            setConfirmDelete(false);
            remove.mutate(deleteId);
            router.push("/transactions");
          }}
        />
      </>
    );
  }

  const error = transaction.error;
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        message="Transaksi tidak ditemukan. Mungkin sudah dihapus."
        action={
          <Link
            href="/transactions"
            className={buttonClasses({ variant: "secondary" })}
          >
            Kembali ke transaksi
          </Link>
        }
      />
    );
  }
  if (transaction.isError) {
    return (
      <ErrorState
        message="Transaksi gagal dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => transaction.refetch()}
        retrying={transaction.isFetching}
      />
    );
  }
  return <TransactionFormSkeleton />;
}
