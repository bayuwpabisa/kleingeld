import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import type { BudgetUpdate } from "@/schemas/budget";

import { budgetKeys } from "./keys";
import { updateBudget } from "./requests";

type UpdateVariables = { id: string; values: BudgetUpdate };

/**
 * Saves a new limit. Not optimistic; a failure is left to the form
 * (`mutation.error`), which stays open to show it.
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, values }: UpdateVariables) => updateBudget(id, values),
    onSuccess() {
      toast.show({ message: "Budget disimpan" });
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
