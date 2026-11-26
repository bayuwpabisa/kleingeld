/**
 * @jest-environment node
 */
import { DEFAULT_CATEGORIES } from "../default-categories";
import {
  buildDemoBudgets,
  DEMO_BUDGET_PLAN,
  MIN_SPENT_FOR_TARGET,
} from "./build-demo-budgets";
import {
  buildDemoTransactions,
  type DemoCategory,
  type DemoTransaction,
} from "./build-demo-transactions";
import { DEMO_CUSTOM_CATEGORIES } from "./demo-user";

const categories: DemoCategory[] = [
  ...DEFAULT_CATEGORIES,
  ...DEMO_CUSTOM_CATEGORIES,
].map((c, i) => ({ id: `cat-${i}`, name: c.name, type: c.type }));

function idOf(name: string) {
  const found = categories.find((c) => c.name === name);
  if (!found) throw new Error(`No test category named ${name}`);
  return found.id;
}

// The integer rule from the budgets plan (B3 moves it to budget-status.ts).
function level(spent: number, amount: number) {
  if (spent > amount) return "over";
  if (spent * 100 >= amount * 80) return "warning";
  return "ok";
}

function levelOfPercent(percent: number) {
  if (percent > 100) return "over";
  if (percent >= 80) return "warning";
  return "ok";
}

function spentThisMonth(
  rows: readonly DemoTransaction[],
  categoryId: string,
  today: string,
) {
  const month = today.slice(0, 7);
  return rows
    .filter(
      (r) =>
        r.categoryId === categoryId &&
        r.type === "expense" &&
        r.date.startsWith(month),
    )
    .reduce((total, r) => total + r.amount, 0);
}

function build(today: string, transactions?: DemoTransaction[]) {
  const rows = transactions ?? buildDemoTransactions({ today, categories });
  return {
    rows,
    budgets: buildDemoBudgets({ today, categories, transactions: rows }),
  };
}

function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (
    let day = Date.parse(`${from}T00:00:00Z`);
    day <= Date.parse(`${to}T00:00:00Z`);
    day += 24 * 60 * 60 * 1000
  ) {
    days.push(new Date(day).toISOString().slice(0, 10));
  }
  return days;
}

describe("buildDemoBudgets", () => {
  const today = "2026-11-26";

  it("gives five expense categories a budget", () => {
    const { budgets } = build(today);
    const names = budgets.map(
      (b) => categories.find((c) => c.id === b.categoryId)?.name,
    );
    expect(names.sort()).toEqual(
      ["Belanja", "Hiburan", "Makan", "Tagihan", "Transport"].sort(),
    );
    for (const budget of budgets) {
      const category = categories.find((c) => c.id === budget.categoryId);
      expect(category?.type).toBe("expense");
    }
  });

  it("shows Makan almost used up and Transport over its limit", () => {
    const { rows, budgets } = build(today);
    const amountOf = (name: string) =>
      budgets.find((b) => b.categoryId === idOf(name))?.amount ?? 0;

    expect(
      level(spentThisMonth(rows, idOf("Makan"), today), amountOf("Makan")),
    ).toBe("warning");
    expect(
      level(
        spentThisMonth(rows, idOf("Transport"), today),
        amountOf("Transport"),
      ),
    ).toBe("over");
    for (const name of ["Tagihan", "Belanja", "Hiburan"]) {
      expect(
        level(spentThisMonth(rows, idOf(name), today), amountOf(name)),
      ).toBe("ok");
    }
  });

  it("keeps each budget's level on every day of a year", () => {
    for (const day of eachDay("2026-01-01", "2027-01-31")) {
      const { rows, budgets } = build(day);
      for (const plan of DEMO_BUDGET_PLAN) {
        const budget = budgets.find((b) => b.categoryId === idOf(plan.name));
        expect(budget).toBeDefined();
        const spent = spentThisMonth(rows, idOf(plan.name), day);
        const expected =
          spent >= MIN_SPENT_FOR_TARGET ? levelOfPercent(plan.percent) : "ok";
        if (level(spent, budget!.amount) !== expected) {
          throw new Error(
            `${day} ${plan.name}: spent ${spent}, limit ${budget!.amount}, expected ${expected}`,
          );
        }
      }
    }
  });

  it("uses whole positive limits in steps of Rp10.000", () => {
    for (const day of ["2026-11-01", "2026-11-09", today]) {
      for (const budget of build(day).budgets) {
        expect(Number.isInteger(budget.amount)).toBe(true);
        expect(budget.amount).toBeGreaterThan(0);
        expect(budget.amount % 10_000).toBe(0);
      }
    }
  });

  it("uses the fixed limit while a category has spent little this month", () => {
    // 1 Dec: only rent has been paid (Tagihan); nothing else yet.
    const { rows, budgets } = build("2026-12-01");
    let fixed = 0;
    for (const plan of DEMO_BUDGET_PLAN) {
      const spent = spentThisMonth(rows, idOf(plan.name), "2026-12-01");
      if (spent >= MIN_SPENT_FOR_TARGET) continue;
      fixed += 1;
      expect(
        budgets.find((b) => b.categoryId === idOf(plan.name))?.amount,
      ).toBe(plan.fixed);
    }
    expect(fixed).toBeGreaterThanOrEqual(3);
  });

  it("counts only this month's spending", () => {
    const { rows, budgets } = build(today);
    const extra: DemoTransaction[] = [
      // Income on an expense category and last month's spending.
      {
        categoryId: idOf("Makan"),
        type: "income",
        amount: 5_000_000,
        date: today,
        note: "x",
      },
      {
        categoryId: idOf("Makan"),
        type: "expense",
        amount: 5_000_000,
        date: "2026-10-31",
        note: "x",
      },
    ];
    expect(build(today, [...rows, ...extra]).budgets).toEqual(budgets);
  });

  it("returns the same budgets for the same input", () => {
    expect(build(today).budgets).toEqual(build(today).budgets);
  });

  it("throws when a category it needs is missing", () => {
    const { rows } = build(today);
    expect(() =>
      buildDemoBudgets({
        today,
        categories: categories.filter((c) => c.name !== "Transport"),
        transactions: rows,
      }),
    ).toThrow(/Transport/);
  });
});
