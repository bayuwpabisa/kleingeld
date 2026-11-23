import type { MonthlyTotal } from "@/schemas/transaction";

import {
  compactRupiah,
  isEmptyTrend,
  trendRangeLabel,
  trendRows,
  trendSummary,
} from "./trend-chart-data";

/** Six months as the API sends them, ending in November (this month). */
const MONTHS: MonthlyTotal[] = [
  { month: "2026-06", income: 10_578_000, expense: 6_571_000 },
  { month: "2026-07", income: 11_218_000, expense: 7_330_500 },
  { month: "2026-08", income: 11_532_500, expense: 6_249_500 },
  { month: "2026-09", income: 11_398_000, expense: 7_084_000 },
  { month: "2026-10", income: 8_500_000, expense: 6_295_500 },
  { month: "2026-11", income: 0, expense: 6_398_500 },
];

/**
 * Intl puts a no-break space (U+00A0) between the number and its unit.
 * Written as a char code, so the source shows it: the character itself
 * looks like a plain space.
 */
const NBSP = String.fromCharCode(0xa0);

describe("compactRupiah", () => {
  it("shortens amounts for the axis the Indonesian way", () => {
    expect(
      [0, 500, 15_000, 6_398_500, 11_532_500, 1_500_000_000].map(compactRupiah),
    ).toStrictEqual([
      "0",
      "500",
      `15${NBSP}rb`,
      `6,4${NBSP}jt`,
      `11,5${NBSP}jt`,
      `1,5${NBSP}M`,
    ]);
  });
});

describe("trendRows", () => {
  it("names each month shortly and labels the values of this month only", () => {
    expect(trendRows(MONTHS)).toStrictEqual([
      {
        month: "2026-06",
        label: "Jun",
        income: 10_578_000,
        expense: 6_571_000,
        incomeLabel: null,
        expenseLabel: null,
      },
      {
        month: "2026-07",
        label: "Jul",
        income: 11_218_000,
        expense: 7_330_500,
        incomeLabel: null,
        expenseLabel: null,
      },
      {
        month: "2026-08",
        label: "Agu",
        income: 11_532_500,
        expense: 6_249_500,
        incomeLabel: null,
        expenseLabel: null,
      },
      {
        month: "2026-09",
        label: "Sep",
        income: 11_398_000,
        expense: 7_084_000,
        incomeLabel: null,
        expenseLabel: null,
      },
      {
        month: "2026-10",
        label: "Okt",
        income: 8_500_000,
        expense: 6_295_500,
        incomeLabel: null,
        expenseLabel: null,
      },
      {
        month: "2026-11",
        label: "Nov",
        income: 0,
        expense: 6_398_500,
        incomeLabel: "0",
        expenseLabel: `6,4${NBSP}jt`,
      },
    ]);
  });
});

describe("trendRangeLabel", () => {
  it("names the year once when all months share it", () => {
    expect(trendRangeLabel(MONTHS)).toBe("Juni–November 2026");
  });

  it("names both years when the range crosses one", () => {
    expect(
      trendRangeLabel([
        { month: "2026-08", income: 0, expense: 0 },
        { month: "2027-01", income: 0, expense: 0 },
      ]),
    ).toBe("Agustus 2026–Januari 2027");
  });
});

describe("trendSummary", () => {
  it("names the range, the highest month of each series, and this month", () => {
    expect(trendSummary(MONTHS)).toBe(
      "Juni–November 2026. " +
        "Pemasukan tertinggi Agustus 2026: 11.532.500 rupiah. " +
        "Pengeluaran tertinggi Juli 2026: 7.330.500 rupiah. " +
        "Bulan ini, November 2026: pemasukan 0 rupiah, pengeluaran 6.398.500 rupiah.",
    );
  });

  it("says when a series has nothing in the whole range", () => {
    const noIncome = MONTHS.map((m) => ({ ...m, income: 0 }));
    expect(trendSummary(noIncome)).toContain(
      "Belum ada pemasukan dalam rentang ini.",
    );
  });

  it("picks the earliest month when two months tie", () => {
    const tie = MONTHS.map((m) =>
      m.month === "2026-09" ? { ...m, expense: 7_330_500 } : m,
    );
    expect(trendSummary(tie)).toContain(
      "Pengeluaran tertinggi Juli 2026: 7.330.500 rupiah.",
    );
  });
});

describe("isEmptyTrend", () => {
  it("is empty only when every month is zero", () => {
    expect(isEmptyTrend(MONTHS)).toBe(false);
    expect(
      isEmptyTrend(MONTHS.map((m) => ({ ...m, income: 0, expense: 0 }))),
    ).toBe(true);
    expect(
      isEmptyTrend([
        { month: "2026-10", income: 0, expense: 0 },
        { month: "2026-11", income: 0, expense: 1 },
      ]),
    ).toBe(false);
  });
});
