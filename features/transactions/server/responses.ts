import { invalidFields } from "@/lib/api/http";

import type { CategoryProblem } from "./transactions-repo";

const categoryMessages: Record<CategoryProblem, string> = {
  category_not_found: "Kategori tidak ditemukan",
  category_type_mismatch: "Kategori tidak cocok dengan tipe transaksi",
};

/** 400 on the category field, shaped like any other validation error. */
export function categoryProblem(reason: CategoryProblem) {
  return invalidFields({ categoryId: [categoryMessages[reason]] });
}
