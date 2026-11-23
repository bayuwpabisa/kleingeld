import type { CategoryTotal } from "@/schemas/transaction";

/** "Per kategori" shows at most this many categories, then "Lainnya". */
export const TOP_CATEGORIES = 5;

export type RankedCategory =
  | {
      kind: "category";
      id: string;
      name: string;
      icon: string;
      total: number;
      count: number;
    }
  | {
      kind: "other";
      name: "Lainnya";
      /** How many categories "Lainnya" adds up. */
      categoryCount: number;
      total: number;
      count: number;
    };

/**
 * The rows of "Per kategori": the largest five categories, then "Lainnya"
 * for the rest, so the chart has at most six bars however many categories
 * the user made. A sixth category is shown itself, since a "Lainnya" of one
 * category would only hide its name. `totals` come from the API, largest
 * first, and keep that order.
 */
export function rankCategories(totals: CategoryTotal[]): RankedCategory[] {
  const named =
    totals.length <= TOP_CATEGORIES + 1
      ? totals
      : totals.slice(0, TOP_CATEGORIES);
  const ranked: RankedCategory[] = named.map(({ category, total, count }) => ({
    kind: "category",
    id: category.id,
    name: category.name,
    icon: category.icon,
    total,
    count,
  }));

  const rest = totals.slice(named.length);
  if (rest.length > 0) {
    ranked.push({
      kind: "other",
      name: "Lainnya",
      categoryCount: rest.length,
      total: rest.reduce((sum, row) => sum + row.total, 0),
      count: rest.reduce((sum, row) => sum + row.count, 0),
    });
  }
  return ranked;
}
