import { summaryLayout } from "./summary-layout";

// The tiers come from measurements in the browser (docs/plans/
// 2026-11-14-transactions-filters.md › H2): the narrowest two-column phone
// is 360px, the narrowest desktop card 1024px with a negative Saldo.
const TWO_COLUMNS =
  "grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-4";
const ONE_COLUMN = "grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4";

describe("summaryLayout", () => {
  it.each([
    [0, TWO_COLUMNS, "text-xl lg:text-2xl"],
    [9_999_999, TWO_COLUMNS, "text-xl lg:text-2xl"],
    [10_000_000, TWO_COLUMNS, "text-xl min-[360px]:text-lg lg:text-2xl"],
    [99_999_999, TWO_COLUMNS, "text-xl min-[360px]:text-lg lg:text-2xl"],
    [100_000_000, TWO_COLUMNS, "text-xl min-[360px]:text-base lg:text-xl"],
    [999_999_999, TWO_COLUMNS, "text-xl min-[360px]:text-base lg:text-xl"],
    [1_000_000_000, ONE_COLUMN, "text-xl lg:text-xl"],
    [9_999_999_999, ONE_COLUMN, "text-xl lg:text-xl"],
    [10_000_000_000, ONE_COLUMN, "text-xl lg:text-lg"],
    [999_999_999_999, ONE_COLUMN, "text-xl lg:text-lg"],
    [1_000_000_000_000, ONE_COLUMN, "text-xl lg:text-base"],
    [99_999_999_999_999, ONE_COLUMN, "text-xl lg:text-base"],
    [100_000_000_000_000, ONE_COLUMN, "text-xl lg:text-sm"],
    [1_000_000_000_000_000, ONE_COLUMN, "text-xl lg:text-sm"],
  ])("lays out %d", (amount, grid, amountClass) => {
    expect(summaryLayout(amount)).toStrictEqual({ grid, amount: amountClass });
  });

  it("counts the digits of a negative amount without its sign", () => {
    expect(summaryLayout(-100_000_000)).toStrictEqual(
      summaryLayout(100_000_000),
    );
    expect(summaryLayout(-99_999_999)).toStrictEqual(summaryLayout(99_999_999));
  });
});
