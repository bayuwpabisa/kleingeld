import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import type { TransactionDto, TransactionInput } from "@/schemas/transaction";

import { replaceTransaction } from "./cache";
import { transactionKeys } from "./keys";
import {
  cachedCategory,
  failureToast,
  findCachedTransaction,
  restoreLists,
  snapshotLists,
  updateLists,
} from "./optimistic";
import { updateTransaction } from "./requests";

type UpdateVariables = { id: string; values: TransactionInput };

/** Saves an edited transaction; the row changes at once in every list. */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: ({ id, values }: UpdateVariables) =>
      updateTransaction(id, values),
    async onMutate({ id, values }: UpdateVariables) {
      const detailKey = transactionKeys.detail(id);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const snapshot = await snapshotLists(queryClient);
      const previous = findCachedTransaction(queryClient, id);
      const previousDetail =
        queryClient.getQueryData<TransactionDto>(detailKey);

      if (previous) {
        const updated: TransactionDto = {
          ...previous,
          type: values.type,
          amount: values.amount,
          date: values.date,
          note: values.note ?? null,
          category: cachedCategory(queryClient, values.categoryId),
          updatedAt: new Date().toISOString(),
        };
        updateLists(queryClient, (page, query) =>
          replaceTransaction(page, updated, query),
        );
        if (previousDetail) queryClient.setQueryData(detailKey, updated);
      }
      return { snapshot, previousDetail };
    },
    onError(error, variables, context) {
      if (context) {
        restoreLists(queryClient, context.snapshot);
        queryClient.setQueryData(
          transactionKeys.detail(variables.id),
          context.previousDetail,
        );
      }
      toast.show(
        failureToast("disimpan", error, () => mutation.mutate(variables)),
      );
    },
    onSuccess() {
      toast.show({ message: "Transaksi disimpan" });
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });

  return mutation;
}
