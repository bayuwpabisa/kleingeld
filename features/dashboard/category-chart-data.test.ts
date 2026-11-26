import {
  categoryRows,
  categorySummary,
  fitLabel,
  shareLabel,
} from "./category-chart-data";
import type { RankedCategory } from "./rank-categories";

/** November's expense as rankCategories hands it over: five, then Lainnya. */
const RANKED: RankedCategory[] = [
  {
    kind: "category",
    id: "cat-tagihan",
    name: "Tagihan",
    icon: "receipt",
    total: 3_241_500,
    count: 4,
  },
  {
    kind: "category",
    id: "cat-makan",
    name: "Makan",
    icon: "utensils",
    total: 1_275_000,
    count: 30,
  },
  {
    kind: "category",
    id: "cat-transport",
    name: "Transport",
    icon: "bus",
    total: 720_000,
    count: 12,
  },
  {
    kind: "category",
    id: "cat-belanja",
    name: "Belanja",
    icon: "shopping-bag",
    total: 510_000,
    count: 3,
  },
  {
    kind: "category",
    id: "cat-kesehatan",
    name: "Kesehatan",
    icon: "heart-pulse",
    total: 300_000,
    count: 1,
  },
  {
    kind: "other",
    name: "Lainnya",
    categoryCount: 2,
    total: 361_000,
    count: 5,
  },
];

/** Intl puts a no-break space (U+00A0) between a number and its unit. */
const NBSP = String.fromCharCode(0xa0);

describe("categoryRows", () => {
  it("gives each bar its label, short amount and share of the whole month", () => {
    expect(categoryRows(RANKED)).toStrictEqual([
      {
        key: "cat-tagihan",
        label: "Tagihan",
        total: 3_241_500,
        count: 4,
        share: 3_241_500 / 6_407_500,
        shareLabel: "51%",
        valueLabel: `3,2${NBSP}jt`,
      },
      {
        key: "cat-makan",
        label: "Makan",
        total: 1_275_000,
        count: 30,
        share: 1_275_000 / 6_407_500,
        shareLabel: "20%",
        valueLabel: `1,3${NBSP}jt`,
      },
      {
        key: "cat-transport",
        label: "Transport",
        total: 720_000,
        count: 12,
        share: 720_000 / 6_407_500,
        shareLabel: "11%",
        valueLabel: `720${NBSP}rb`,
      },
      {
        key: "cat-belanja",
        label: "Belanja",
        total: 510_000,
        count: 3,
        share: 510_000 / 6_407_500,
        shareLabel: "8%",
        valueLabel: `510${NBSP}rb`,
      },
      {
        key: "cat-kesehatan",
        label: "Kesehatan",
        total: 300_000,
        count: 1,
        share: 300_000 / 6_407_500,
        shareLabel: "5%",
        valueLabel: `300${NBSP}rb`,
      },
      {
        key: "other",
        label: "Lainnya (2 kategori)",
        total: 361_000,
        count: 5,
        share: 361_000 / 6_407_500,
        shareLabel: "6%",
        valueLabel: `361${NBSP}rb`,
      },
    ]);
  });

  it("is empty without categories", () => {
    expect(categoryRows([])).toStrictEqual([]);
  });

  it("keeps the largest amounts short enough for the end of a bar", () => {
    const [row] = categoryRows([
      {
        kind: "category",
        id: "cat-besar",
        name: "Besar",
        icon: "tag",
        total: 999_999_999_999_999,
        count: 1,
      },
    ]);
    expect(row?.valueLabel).toBe(`1000${NBSP}T`);
    expect(row?.shareLabel).toBe("100%");
  });
});

describe("shareLabel", () => {
  it("rounds to whole percents", () => {
    expect([1, 0.50589, 0.005].map(shareLabel)).toStrictEqual([
      "100%",
      "51%",
      "1%",
    ]);
  });

  it("never says 0% for a category that has spending", () => {
    expect(shareLabel(0.004)).toBe("<1%");
  });
});

describe("categorySummary", () => {
  it("names the month, its total, then every bar from the largest", () => {
    expect(categorySummary(categoryRows(RANKED), "2026-11")).toBe(
      "Pengeluaran November 2026: total 6.407.500 rupiah. " +
        "Dari yang terbesar: Tagihan 3.241.500 rupiah (51%), " +
        "Makan 1.275.000 rupiah (20%), " +
        "Transport 720.000 rupiah (11%), " +
        "Belanja 510.000 rupiah (8%), " +
        "Kesehatan 300.000 rupiah (5%), " +
        "Lainnya (2 kategori) 361.000 rupiah (6%).",
    );
  });

  it("reads a single category without a ranking", () => {
    const [first] = RANKED;
    expect(categorySummary(categoryRows(first ? [first] : []), "2026-11")).toBe(
      "Pengeluaran November 2026: total 3.241.500 rupiah. " +
        "Semuanya Tagihan.",
    );
  });
});

describe("fitLabel", () => {
  it("keeps a name that fits", () => {
    expect(fitLabel("Transport", 9)).toBe("Transport");
  });

  it("cuts a long name and ends it with an ellipsis, within the limit", () => {
    expect(fitLabel("Langganan streaming", 10)).toBe("Langganan…");
  });
});
