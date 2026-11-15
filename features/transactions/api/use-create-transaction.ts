import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import type { TransactionDto, TransactionInput } from "@/schemas/transaction";

import { insertTransaction } from "./cache";
import { transactionKeys } from "./keys";
import {
  cachedCategory,
  failureToast,
  restoreLists,
  snapshotLists,
  updateLists,
} from "./optimistic";
import { createTransaction } from "./requests";

let optimisticCount = 0;

/**
 * Adds a transaction. It appears in the lists at once (with a temporary
 * "optimistic-" id) and is replaced by the server's copy on the refetch.
 * The callbacks live on the mutation, so they still run when the form that
 * started it has already closed.
 */
export function useCreateTransaction({
  successMessage = "Transaksi disimpan",
}: { successMessage?: string } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: createTransaction,
    async onMutate(input: TransactionInput) {
      const snapshot = await snapshotLists(queryClient);
      optimisticCount += 1;
      const now = new Date().toISOString();
      const optimistic: TransactionDto = {
        id: `optimistic-${optimisticCount}`,
        type: input.type,
        amount: input.amount,
        date: input.date,
        note: input.note ?? null,
        category: cachedCategory(queryClient, input.categoryId),
        createdAt: now,
        updatedAt: now,
      };
      updateLists(queryClient, (page) => insertTransaction(page, optimistic));
      return { snapshot };
    },
    onError(error, input, context) {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.show(failureToast("disimpan", error, () => mutation.mutate(input)));
    },
    onSuccess() {
      toast.show({ message: successMessage });
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });

  return mutation;
}
