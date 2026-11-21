"use client";

import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  deleteClosed,
  deleteRequested,
  editorClosed,
  type EditorTarget,
} from "@/lib/store/transaction-editor-slice";

import { useCreateTransaction } from "../api/use-create-transaction";
import { useDeleteTransaction } from "../api/use-delete-transaction";
import { useTransaction } from "../api/use-transaction";
import { useUpdateTransaction } from "../api/use-update-transaction";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import {
  TransactionFormLoader,
  TransactionFormSkeleton,
} from "./transaction-form-loader";

/**
 * The desktop dialogs for adding, editing and deleting a transaction, mounted
 * once in app/(app)/layout.tsx and opened through the Redux store
 * (lib/store/transaction-editor-slice.ts) from any page. Phones use the
 * /transactions/new and /transactions/[id]/edit pages instead.
 */
export function TransactionDialogs() {
  const dispatch = useAppDispatch();
  const editor = useAppSelector((state) => state.transactionEditor.editor);
  const deleteId = useAppSelector((state) => state.transactionEditor.deleteId);
  const remove = useDeleteTransaction();

  return (
    <>
      <Dialog
        open={editor.mode !== "closed"}
        onOpenChange={(open) => {
          if (!open) dispatch(editorClosed());
        }}
        title={editor.mode === "edit" ? "Ubah transaksi" : "Tambah transaksi"}
      >
        {/* Mounted only while open, so every opening starts a fresh form. */}
        {editor.mode !== "closed" && (
          <EditorContent
            key={editor.mode === "edit" ? editor.id : "create"}
            target={editor}
          />
        )}
      </Dialog>

      <DeleteTransactionDialog
        id={deleteId}
        onClose={() => dispatch(deleteClosed())}
        onConfirm={(id) => {
          dispatch(deleteClosed());
          remove.mutate(id);
        }}
      />
    </>
  );
}

function EditorContent({ target }: { target: EditorTarget }) {
  const dispatch = useAppDispatch();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const close = () => dispatch(editorClosed());

  if (target.mode === "create") {
    return (
      <TransactionFormLoader
        onSubmit={(values) => {
          close();
          create.mutate(values);
        }}
        onCancel={close}
      />
    );
  }
  return (
    <EditForm
      id={target.id}
      onClose={close}
      onSave={(values) => {
        close();
        update.mutate({ id: target.id, values });
      }}
    />
  );
}

function EditForm({
  id,
  onClose,
  onSave,
}: {
  id: string;
  onClose: () => void;
  onSave: Parameters<typeof TransactionFormLoader>[0]["onSubmit"];
}) {
  const dispatch = useAppDispatch();
  const transaction = useTransaction(id);

  if (transaction.data) {
    return (
      <TransactionFormLoader
        transaction={transaction.data}
        onSubmit={onSave}
        onCancel={onClose}
        onDelete={() => dispatch(deleteRequested(id))}
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
