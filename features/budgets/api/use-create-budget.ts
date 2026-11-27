import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import { failureToast } from "@/features/transactions/api/optimistic";
import type { BudgetInput } from "@/schemas/budget";

import { budgetKeys } from "./keys";
import { createBudget } from "./requests";

/**
 * Adds a budget. Not optimistic: the caller shows it busy until the server
 * answers. A failure is left to the form (`mutation.error`), which stays open
 * to show it; `toastErrors` reports it in a toast instead, for Urungkan,
 * which has no form. The callbacks live on the mutation, so they still run
 * when the form has already closed.
 */
export function useCreateBudget({
  successMessage = "Budget disimpan",
  toastErrors = false,
}: { successMessage?: string; toastErrors?: boolean } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onError(error, input) {
      if (!toastErrors) return;
      toast.show(
        failureToast("disimpan", error, () => mutation.mutate(input), "Budget"),
      );
    },
    onSuccess() {
      toast.show({ message: successMessage });
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}
