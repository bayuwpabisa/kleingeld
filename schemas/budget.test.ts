import {
  budgetInputSchema,
  budgetListQuerySchema,
  budgetUpdateSchema,
} from "./budget";
import { MAX_AMOUNT } from "./transaction";

const CATEGORY_ID = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const valid = { categoryId: CATEGORY_ID, amount: 1_500_000 };

function fieldErrors(result: { error?: { issues: unknown[] } }) {
  return result.error?.issues.map((issue) => {
    const { path, message } = issue as { path: PropertyKey[]; message: string };
    return [path.join("."), message];
  });
}

describe("budgetInputSchema", () => {
  it("accepts a category and a limit", () => {
    expect(budgetInputSchema.parse(valid)).toEqual(valid);
  });

  it("uses the transaction amount rules and messages", () => {
    expect(
      fieldErrors(budgetInputSchema.safeParse({ ...valid, amount: 0 })),
    ).toEqual([["amount", "Nominal harus lebih dari 0"]]);
    expect(
      fieldErrors(budgetInputSchema.safeParse({ ...valid, amount: 1.5 })),
    ).toEqual([["amount", "Nominal harus bilangan bulat"]]);
    expect(
      fieldErrors(
        budgetInputSchema.safeParse({ ...valid, amount: MAX_AMOUNT + 1 }),
      ),
    ).toEqual([["amount", "Nominal maksimal Rp1.000.000.000.000"]]);
    expect(
      fieldErrors(budgetInputSchema.safeParse({ ...valid, amount: NaN })),
    ).toEqual([["amount", "Isi nominal"]]);
    expect(
      budgetInputSchema.parse({ ...valid, amount: MAX_AMOUNT }).amount,
    ).toBe(MAX_AMOUNT);
  });

  it("asks for a category", () => {
    expect(
      fieldErrors(budgetInputSchema.safeParse({ ...valid, categoryId: "" })),
    ).toEqual([["categoryId", "Pilih kategori"]]);
  });

  it("refuses unknown fields such as userId", () => {
    expect(
      fieldErrors(budgetInputSchema.safeParse({ ...valid, userId: "bob" })),
    ).toEqual([["", "Field tidak dikenal: userId"]]);
  });
});

describe("budgetUpdateSchema", () => {
  it("changes only the limit", () => {
    expect(budgetUpdateSchema.parse({ amount: 2_000_000 })).toEqual({
      amount: 2_000_000,
    });
  });

  it("needs the limit", () => {
    expect(fieldErrors(budgetUpdateSchema.safeParse({}))).toEqual([
      ["amount", "Isi nominal"],
    ]);
  });

  it("refuses a new category", () => {
    expect(
      fieldErrors(
        budgetUpdateSchema.safeParse({ amount: 1, categoryId: CATEGORY_ID }),
      ),
    ).toEqual([["", "Field tidak dikenal: categoryId"]]);
  });
});

describe("budgetListQuerySchema", () => {
  it("reads the month", () => {
    expect(budgetListQuerySchema.parse({ month: "2026-11" })).toEqual({
      month: "2026-11",
    });
  });

  it.each([["2026-13"], ["2026-1"], ["November"], [undefined]])(
    "refuses the month %p",
    (month) => {
      expect(fieldErrors(budgetListQuerySchema.safeParse({ month }))).toEqual([
        ["month", "Bulan tidak valid"],
      ]);
    },
  );
});
