import { conflict, invalidFields } from "@/lib/api/http";

import type { CreateProblem } from "./budgets-repo";

/** Why a budget could not be added, on the category field of the form. */
export function createProblem(reason: CreateProblem) {
  switch (reason) {
    case "category_not_found":
      return invalidFields({ categoryId: ["Kategori tidak ditemukan"] });
    case "category_not_expense":
      return invalidFields({
        categoryId: ["Budget hanya untuk kategori pengeluaran"],
      });
    case "duplicate":
      return conflict("categoryId", "Kategori ini sudah punya budget");
  }
}
