import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import { failureToast } from "@/features/transactions/api/optimistic";
import type { BudgetDto } from "@/schemas/budget";

import { budgetKeys } from "./keys";
import { deleteBudget } from "./requests";
import { useCreateBudget } from "./use-create-budget";

/**
 * Deletes a budget once the server agrees (not optimistic). The toast offers
 * "Urungkan", which adds the same limit for the same category again (with a
 * new id). It takes the whole budget, so the undo knows what to send.
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const restore = useCreateBudget({
    successMessage: "Budget dikembalikan",
    toastErrors: true,
  });

  const mutation = useMutation({
    mutationFn: (budget: BudgetDto) => deleteBudget(budget.id),
    onError(error, budget) {
      toast.show(
        failureToast("dihapus", error, () => mutation.mutate(budget), "Budget"),
      );
    },
    onSuccess(_data, budget) {
      toast.show({
        message: "Budget dihapus",
        action: {
          label: "Urungkan",
          onClick: () =>
            restore.mutate({
              categoryId: budget.category.id,
              amount: budget.amount,
            }),
        },
      });
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}
