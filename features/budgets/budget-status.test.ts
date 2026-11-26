import type { BudgetStatus } from "@/schemas/budget";

import {
  attentionMessage,
  budgetLabel,
  budgetLevel,
  budgetPercent,
  budgetTotals,
  byUrgency,
  daysLeftLabel,
} from "./budget-status";

function status(name: string, amount: number, spent: number): BudgetStatus {
  return {
    id: `budget-${name}`,
    category: { id: `cat-${name}`, name, icon: "tag" },
    amount,
    spent,
    count: spent > 0 ? 1 : 0,
  };
}

describe("budgetLevel", () => {
  it.each([
    [0, "ok"],
    [796, "ok"],
    [799, "ok"],
    [800, "warning"],
    [999, "warning"],
    [1_000, "warning"],
    [1_001, "over"],
    [5_000, "over"],
  ] as const)("spent %i of 1.000 is %s", (spent, level) => {
    expect(budgetLevel(spent, 1_000)).toBe(level);
  });

  it("stays exact for the largest limits", () => {
    const amount = 1_000_000_000_000;
    expect(budgetLevel(amount * 0.8 - 1, amount)).toBe("ok");
    expect(budgetLevel(amount * 0.8, amount)).toBe("warning");
    expect(budgetLevel(amount + 1, amount)).toBe("over");
  });
});

describe("budgetPercent and budgetLabel", () => {
  // Rounded down, except over the limit, where it is rounded up, so the
  // number never disagrees with the colour.
  it.each([
    [0, 0, "0% terpakai"],
    [450, 45, "45% terpakai"],
    [796, 79, "79% terpakai"],
    [799, 79, "79% terpakai"],
    [800, 80, "80% · hampir habis"],
    [855, 85, "85% · hampir habis"],
    [999, 99, "99% · hampir habis"],
    [1_000, 100, "100% · hampir habis"],
    [1_002, 101, "101% · lewat batas"],
    [1_120, 112, "112% · lewat batas"],
  ] as const)("spent %i of 1.000 is %i%%: %s", (spent, percent, label) => {
    expect(budgetPercent(spent, 1_000)).toBe(percent);
    expect(budgetLabel(spent, 1_000)).toBe(label);
  });
});

describe("budgetTotals", () => {
  it("adds up the limits and the spending", () => {
    expect(
      budgetTotals([
        status("Makan", 1_000_000, 850_000),
        status("Transport", 300_000, 336_000),
      ]),
    ).toStrictEqual({ amount: 1_300_000, spent: 1_186_000, left: 114_000 });
  });

  it("goes below 0 when the spending is over all the limits", () => {
    expect(budgetTotals([status("Makan", 100, 150)]).left).toBe(-50);
  });

  it("is 0 without budgets", () => {
    expect(budgetTotals([])).toStrictEqual({ amount: 0, spent: 0, left: 0 });
  });
});

describe("byUrgency", () => {
  it("puts over the limit first, then almost used up, then the highest share", () => {
    const budgets = [
      status("Belanja", 1_000, 500),
      status("Hiburan", 1_000, 1_100),
      status("Makan", 1_000, 850),
      status("Tagihan", 1_000, 600),
      status("Transport", 1_000, 1_500),
      status("Kesehatan", 1_000, 900),
    ];
    expect(byUrgency(budgets).map((b) => b.category.name)).toEqual([
      "Transport",
      "Hiburan",
      "Kesehatan",
      "Makan",
      "Tagihan",
      "Belanja",
    ]);
  });

  it("orders equal shares by name and leaves the input alone", () => {
    const budgets = [status("Makan", 100, 50), status("Belanja", 200, 100)];
    expect(byUrgency(budgets).map((b) => b.category.name)).toEqual([
      "Belanja",
      "Makan",
    ]);
    expect(budgets.map((b) => b.category.name)).toEqual(["Makan", "Belanja"]);
  });
});

describe("attentionMessage", () => {
  it("names each budget that needs attention, in the list's order", () => {
    expect(
      attentionMessage([
        status("Belanja", 1_000, 500),
        status("Hiburan", 1_000, 1_120),
        status("Makan", 1_000, 850),
      ]),
    ).toBe(
      "2 kategori perlu perhatian: Hiburan lewat batas (112%) dan Makan hampir habis (85%).",
    );
  });

  it("works for one and for three", () => {
    expect(attentionMessage([status("Makan", 1_000, 800)])).toBe(
      "1 kategori perlu perhatian: Makan hampir habis (80%).",
    );
    expect(
      attentionMessage([
        status("Belanja", 1_000, 900),
        status("Hiburan", 1_000, 1_001),
        status("Makan", 1_000, 1_000),
      ]),
    ).toBe(
      "3 kategori perlu perhatian: Belanja hampir habis (90%), Hiburan lewat batas (101%), dan Makan hampir habis (100%).",
    );
  });

  it("is null when every budget is below 80%", () => {
    expect(attentionMessage([status("Makan", 1_000, 799)])).toBeNull();
    expect(attentionMessage([])).toBeNull();
  });
});

describe("daysLeftLabel", () => {
  it.each([
    ["2026-11-26", "untuk 5 hari lagi"],
    ["2026-11-01", "untuk 30 hari lagi"],
    ["2026-11-29", "untuk 2 hari lagi"],
    ["2026-11-30", "untuk hari ini"],
    ["2026-02-28", "untuk hari ini"],
    ["2028-02-28", "untuk 2 hari lagi"],
    ["2026-12-31", "untuk hari ini"],
  ])("on %s says %s", (today, label) => {
    expect(daysLeftLabel(today)).toBe(label);
  });
});
