import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import type { CategoryDto } from "@/schemas/category";

export const categoryKeys = {
  all: ["categories"] as const,
};

export function fetchCategories(signal?: AbortSignal) {
  return apiFetch<CategoryDto[]>("/api/categories", { signal });
}

/** The user's categories. They rarely change, so they stay fresh for 5 min. */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60 * 1000,
  });
}
