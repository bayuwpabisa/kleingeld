import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";

import { removeTransaction } from "./cache";
import { transactionKeys } from "./keys";
import {
  failureToast,
  findCachedTransaction,
  refetchAfterChange,
  restoreLists,
  snapshotLists,
  toInput,
  updateLists,
} from "./optimistic";
import { deleteTransaction } from "./requests";
import { useCreateTransaction } from "./use-create-transaction";

/**
 * Deletes a transaction: the row disappears at once, and the toast offers
 * "Urungkan", which adds the same transaction again (with a new id).
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const restore = useCreateTransaction({
    successMessage: "Transaksi dikembalikan",
  });

  const mutation = useMutation({
    mutationFn: deleteTransaction,
    async onMutate(id: string) {
      const snapshot = await snapshotLists(queryClient);
      const removed = findCachedTransaction(queryClient, id);
      updateLists(queryClient, (page) => removeTransaction(page, id));
      return { snapshot, removed };
    },
    onError(error, id, context) {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.show(failureToast("dihapus", error, () => mutation.mutate(id)));
    },
    onSuccess(_data, id, context) {
      queryClient.removeQueries({ queryKey: transactionKeys.detail(id) });
      const removed = context?.removed;
      toast.show({
        message: "Transaksi dihapus",
        action: removed
          ? {
              label: "Urungkan",
              onClick: () => restore.mutate(toInput(removed)),
            }
          : undefined,
      });
    },
    onSettled() {
      return refetchAfterChange(queryClient);
    },
  });

  return mutation;
}
