import type { TransactionDto } from "@/schemas/transaction";

import { groupByDate } from "./group-by-date";

const t = (id: string, date: string) => ({ id, date }) as TransactionDto;

describe("groupByDate", () => {
  it("groups consecutive transactions of a day and keeps the order", () => {
    const groups = groupByDate([
      t("a", "2026-11-15"),
      t("b", "2026-11-15"),
      t("c", "2026-11-14"),
    ]);
    expect(groups.map((g) => [g.date, g.items.map((i) => i.id)])).toEqual([
      ["2026-11-15", ["a", "b"]],
      ["2026-11-14", ["c"]],
    ]);
  });

  it("returns no groups for no transactions", () => {
    expect(groupByDate([])).toEqual([]);
  });
});
