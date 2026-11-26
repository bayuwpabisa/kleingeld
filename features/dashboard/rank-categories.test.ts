import type { CategoryTotal } from "@/schemas/transaction";

import { rankCategories } from "./rank-categories";

/** Rows as the API sends them: largest total first. */
function totals(...amounts: number[]): CategoryTotal[] {
  return amounts.map((total, i) => ({
    category: { id: `cat-${i}`, name: `Kategori ${i}`, icon: "tag" },
    total,
    count: i + 1,
  }));
}

describe("rankCategories", () => {
  it("is empty without totals", () => {
    expect(rankCategories([])).toStrictEqual([]);
  });

  it("keeps up to five categories as they are, in the API's order", () => {
    expect(rankCategories(totals(500, 400, 300))).toStrictEqual([
      {
        kind: "category",
        id: "cat-0",
        name: "Kategori 0",
        icon: "tag",
        total: 500,
        count: 1,
      },
      {
        kind: "category",
        id: "cat-1",
        name: "Kategori 1",
        icon: "tag",
        total: 400,
        count: 2,
      },
      {
        kind: "category",
        id: "cat-2",
        name: "Kategori 2",
        icon: "tag",
        total: 300,
        count: 3,
      },
    ]);
  });

  it("shows a sixth category itself rather than a 'Lainnya' of one", () => {
    const ranked = rankCategories(totals(600, 500, 400, 300, 200, 100));
    expect(ranked).toHaveLength(6);
    expect(ranked.every((row) => row.kind === "category")).toBe(true);
    expect(ranked.at(-1)).toMatchObject({ name: "Kategori 5", total: 100 });
  });

  it("folds everything after the fifth into 'Lainnya'", () => {
    const ranked = rankCategories(
      totals(700, 600, 500, 400, 300, 200, 100, 50),
    );

    expect(ranked).toHaveLength(6);
    expect(ranked.slice(0, 5).map((row) => row.name)).toStrictEqual([
      "Kategori 0",
      "Kategori 1",
      "Kategori 2",
      "Kategori 3",
      "Kategori 4",
    ]);
    // Kategori 5–7: totals 200 + 100 + 50, counts 6 + 7 + 8.
    expect(ranked.at(-1)).toStrictEqual({
      kind: "other",
      name: "Lainnya",
      categoryCount: 3,
      total: 350,
      count: 21,
    });
  });

  it("puts 'Lainnya' last even when it is larger than the fifth", () => {
    const ranked = rankCategories(totals(900, 800, 700, 600, 100, 90, 80));
    expect(ranked.at(-1)).toMatchObject({ kind: "other", total: 170 });
    expect(ranked.at(-2)).toMatchObject({ name: "Kategori 4", total: 100 });
  });
});
