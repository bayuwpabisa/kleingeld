"use client";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/date";

import { useTransaction } from "../api/use-transaction";
import { transactionTitle } from "./transaction-title";

type DeleteTransactionDialogProps = {
  /** The transaction to delete; null keeps the dialog closed. */
  id: string | null;
  onClose: () => void;
  /** Hapus pressed: delete it (the dialog closes at once, optimistic). */
  onConfirm: (id: string) => void;
};

/**
 * "Hapus transaksi ini?" (wireframe 08, DESIGN.md › States): a preview of
 * the row, what changes, then Batal and Hapus. A bottom sheet on phones.
 * The delete can be undone from the toast that follows.
 */
export function DeleteTransactionDialog({
  id,
  onClose,
  onConfirm,
}: DeleteTransactionDialogProps) {
  const { data: transaction } = useTransaction(id);

  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Hapus transaksi ini?"
    >
      {transaction && (
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
            <CategoryIcon name={transaction.category.icon} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate">{transactionTitle(transaction)}</p>
            <p className="truncate text-sm text-fg-muted">
              {transaction.category.name} · {formatDate(transaction.date)}
            </p>
          </div>
          <Money amount={transaction.amount} type={transaction.type} />
        </div>
      )}
      <p className="text-fg-muted">
        {transaction
          ? `Saldo dan budget ${transaction.category.name} bulan ini akan dihitung ulang.`
          : "Saldo dan budget bulan ini akan dihitung ulang."}
      </p>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="danger"
          disabled={id === null}
          onClick={() => {
            if (id) onConfirm(id);
          }}
        >
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );
}
