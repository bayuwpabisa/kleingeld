/**
 * @jest-environment node
 */
import { DEFAULT_CATEGORIES } from "../default-categories";
import {
  buildDemoTransactions,
  type DemoCategory,
} from "./build-demo-transactions";
import { DEMO_CUSTOM_CATEGORIES } from "./demo-user";

const categories: DemoCategory[] = [
  ...DEFAULT_CATEGORIES,
  ...DEMO_CUSTOM_CATEGORIES,
].map((c, i) => ({ id: `cat-${i}`, name: c.name, type: c.type }));

const categoryById = new Map(categories.map((c) => [c.id, c]));
const salaryId = categories.find((c) => c.name === "Gaji")?.id;

function totalsByMonth(rows: ReturnType<typeof buildDemoTransactions>) {
  const totals = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const total = totals.get(month) ?? { income: 0, expense: 0 };
    total[row.type] += row.amount;
    totals.set(month, total);
  }
  return totals;
}

describe("buildDemoTransactions", () => {
  const today = "2026-11-09";
  const rows = buildDemoTransactions({ today, categories });

  it("covers the first day of two months ago up to today", () => {
    const dates = rows.map((r) => r.date).sort();
    expect(dates.at(0)).toBe("2026-09-01");
    expect(dates.at(-1)! <= today).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(120);
    expect(rows.length).toBeLessThanOrEqual(250);
  });

  it("pays a salary in every full month", () => {
    for (const month of ["2026-09", "2026-10"]) {
      const salaries = rows.filter(
        (r) => r.categoryId === salaryId && r.date.startsWith(month),
      );
      expect(salaries).toHaveLength(1);
    }
  });

  it("uses positive whole-rupiah amounts", () => {
    for (const row of rows) {
      expect(Number.isInteger(row.amount)).toBe(true);
      expect(row.amount).toBeGreaterThan(0);
    }
  });

  it("matches each transaction type to its category type", () => {
    for (const row of rows) {
      expect(categoryById.get(row.categoryId)?.type).toBe(row.type);
    }
  });

  it("spends less than it earns in every full month", () => {
    const totals = totalsByMonth(rows);
    for (const month of ["2026-09", "2026-10"]) {
      const total = totals.get(month);
      expect(total).toBeDefined();
      expect(total!.expense).toBeLessThan(total!.income);
    }
  });

  it("returns the same rows for the same input", () => {
    expect(buildDemoTransactions({ today, categories })).toEqual(rows);
  });

  it("keeps past days the same when today moves forward", () => {
    const tomorrow = buildDemoTransactions({ today: "2026-11-10", categories });
    const upToToday = tomorrow.filter((r) => r.date <= today);
    expect(upToToday).toEqual(rows.filter((r) => r.date >= "2026-09-01"));
  });

  it("works on the first day of a month and across a year boundary", () => {
    const janRows = buildDemoTransactions({ today: "2027-01-01", categories });
    const dates = janRows.map((r) => r.date).sort();
    expect(dates.at(0)).toBe("2026-11-01");
    expect(dates.at(-1)! <= "2027-01-01").toBe(true);
  });

  it("throws when a category it needs is missing", () => {
    expect(() =>
      buildDemoTransactions({
        today,
        categories: categories.filter((c) => c.name !== "Makan"),
      }),
    ).toThrow(/Makan/);
  });
});
