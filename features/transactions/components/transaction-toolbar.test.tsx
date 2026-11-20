import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { todayInJakarta } from "@/lib/date";
import type { CategoryDto } from "@/schemas/category";
import type { TransactionListQuery } from "@/schemas/transaction";
import { setUrl } from "@/test/url-navigation";

import { DEFAULT_LIST_QUERY } from "../list-query-url";
import { monthRange, recentMonths } from "../periods";
import { useListQuery } from "../use-list-query";
import { SEARCH_DELAY_MS, TransactionToolbar } from "./transaction-toolbar";

jest.mock("next/navigation", () => jest.requireActual("@/test/url-navigation"));

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const GAJI = "5b3e4d60-ac9f-4e70-b182-3c4d5e6f7081";
const UNKNOWN = "9e8d7c6b-5a49-4382-a716-151413121110";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
  { id: GAJI, name: "Gaji", type: "income", icon: "wallet" },
];

const query = (extra: Partial<TransactionListQuery> = {}) => ({
  ...DEFAULT_LIST_QUERY,
  ...extra,
});

/** The toolbar with its props under the test's control. */
function renderToolbar(
  initial: TransactionListQuery,
  { loading = false }: { loading?: boolean } = {},
) {
  // An explicit flag: passing `undefined` would pick up a default value.
  const toolbarCategories = loading ? undefined : categories;
  const setFilters = jest.fn();
  const setSort = jest.fn();
  const view = (current: TransactionListQuery) => (
    <TransactionToolbar
      query={current}
      categories={toolbarCategories}
      setFilters={setFilters}
      setSort={setSort}
    />
  );
  const utils = render(view(initial));
  return {
    ...utils,
    setFilters,
    setSort,
    /** The URL changed: render with the new query. */
    urlChanged: (next: TransactionListQuery) => utils.rerender(view(next)),
  };
}

/** The toolbar wired to the URL as on the page. */
function UrlToolbar() {
  const { query: current, setFilters, setSort } = useListQuery();
  return (
    <TransactionToolbar
      query={current}
      categories={categories}
      setFilters={setFilters}
      setSort={setSort}
    />
  );
}

function renderWithUrl(url = "/transactions") {
  setUrl(url);
  return render(<UrlToolbar />);
}

const searchBox = () =>
  screen.getByRole("searchbox", { name: "Cari transaksi" });
const periodChip = () => screen.getByRole("combobox", { name: "Periode" });
const categoryChip = () => screen.getByRole("combobox", { name: "Kategori" });
const rangeFields = () => screen.queryByLabelText("Dari");

describe("search box", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const typing = () =>
    userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  it("sends the search once typing stops, replacing the history entry", async () => {
    const user = typing();
    const { setFilters } = renderToolbar(query());

    await user.type(searchBox(), "kop");
    expect(setFilters).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith({ q: "kop" }, { replace: true });
  });

  it("keeps newer typing when its own search reaches the URL late", async () => {
    const user = typing();
    const { setFilters, urlChanged } = renderToolbar(query());

    await user.type(searchBox(), "kop");
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    await user.type(searchBox(), "i");
    // The URL now shows the search sent before the "i" was typed.
    urlChanged(query({ q: "kop" }));

    expect(searchBox()).toHaveValue("kopi");
    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    expect(setFilters).toHaveBeenLastCalledWith(
      { q: "kopi" },
      { replace: true },
    );
  });

  it("shows a search changed elsewhere (Back, Hapus filter)", () => {
    const { urlChanged } = renderToolbar(query({ q: "kopi" }));
    expect(searchBox()).toHaveValue("kopi");

    urlChanged(query({ q: "teh" }));
    expect(searchBox()).toHaveValue("teh");

    urlChanged(query());
    expect(searchBox()).toHaveValue("");
  });

  it("searches at once on Enter, and only once", async () => {
    const user = typing();
    const { setFilters } = renderToolbar(query());

    await user.type(searchBox(), "gaji{Enter}");
    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith({ q: "gaji" }, { replace: true });

    act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS));
    expect(setFilters).toHaveBeenCalledTimes(1);
  });

  it("clears the search and keeps the focus in the box", async () => {
    const user = typing();
    const { setFilters } = renderToolbar(query({ q: "kopi" }));

    await user.click(screen.getByRole("button", { name: "Hapus pencarian" }));

    // toStrictEqual: `q: undefined` must be there to remove the search;
    // toHaveBeenCalledWith would also accept an object without it.
    expect(setFilters.mock.calls).toStrictEqual([
      [{ q: undefined }, { replace: true }],
    ]);
    expect(searchBox()).toHaveValue("");
    expect(searchBox()).toHaveFocus();
  });
});

describe("period", () => {
  const month = recentMonths(todayInJakarta())[1];
  if (!month) throw new Error("no month");
  const whole = monthRange(month.value);

  it("keeps the date fields open while typing a range that is a whole month", async () => {
    const user = userEvent.setup();
    renderWithUrl();

    await user.selectOptions(periodChip(), "Rentang tanggal…");
    await user.type(screen.getByLabelText("Dari"), whole.from);
    const to = screen.getByLabelText("Sampai");
    await user.type(to, whole.to);

    expect(window.location.search).toBe(`?from=${whole.from}&to=${whole.to}`);
    expect(screen.getByLabelText("Sampai")).toBe(to);
    expect(to).toHaveFocus();
  });

  it("closes the date fields when Semua waktu is picked again", async () => {
    const user = userEvent.setup();
    renderWithUrl();

    await user.selectOptions(periodChip(), "Rentang tanggal…");
    expect(rangeFields()).toBeInTheDocument();
    await user.selectOptions(periodChip(), "Semua waktu");

    expect(rangeFields()).not.toBeInTheDocument();
    expect(periodChip()).toHaveDisplayValue("Semua waktu");
  });

  it("closes the date fields when a month is picked", async () => {
    const user = userEvent.setup();
    renderWithUrl();

    await user.selectOptions(periodChip(), "Rentang tanggal…");
    await user.selectOptions(periodChip(), month.label);

    expect(window.location.search).toBe(`?from=${whole.from}&to=${whole.to}`);
    expect(rangeFields()).not.toBeInTheDocument();
    expect(periodChip()).toHaveDisplayValue(month.label);
  });

  it("closes the date fields when the dates leave the URL elsewhere", () => {
    renderWithUrl("/transactions?from=2026-11-10&to=2026-11-20");
    expect(rangeFields()).toBeInTheDocument();

    act(() => window.history.pushState(null, "", "/transactions"));

    expect(rangeFields()).not.toBeInTheDocument();
  });

  it("explains a range that ends before it starts and does not apply it", async () => {
    const user = userEvent.setup();
    renderWithUrl("/transactions?from=2026-11-10");

    const to = screen.getByLabelText("Sampai");
    await user.type(to, "2026-11-01");

    expect(to).toHaveAccessibleDescription(
      "Tanggal awal harus sebelum tanggal akhir",
    );
    expect(window.location.search).toBe("?from=2026-11-10");
  });
});

describe("type and category", () => {
  it("drops a category of the other type", async () => {
    const user = userEvent.setup();
    const { setFilters } = renderToolbar(query({ category: MAKAN }));

    await user.click(screen.getByRole("radio", { name: "Pemasukan" }));

    // toStrictEqual: `category: undefined` must be there to remove the
    // category; toHaveBeenCalledWith would also accept an object without it.
    expect(setFilters.mock.calls).toStrictEqual([
      [{ type: "income", category: undefined }],
    ]);
  });

  it("keeps a category of the same type", async () => {
    const user = userEvent.setup();
    const { setFilters } = renderToolbar(query({ category: GAJI }));

    await user.click(screen.getByRole("radio", { name: "Pemasukan" }));

    expect(setFilters.mock.calls).toStrictEqual([[{ type: "income" }]]);
  });

  it("offers the categories of the chosen type only", () => {
    renderToolbar(query({ type: "income" }));
    expect(
      screen.getAllByRole("option", { name: /Makan|Gaji|Semua kategori/ }),
    ).toHaveLength(2);
    expect(screen.queryByRole("option", { name: "Makan" })).toBeNull();
  });

  it("names a category the list does not know instead of Semua kategori", () => {
    renderToolbar(query({ category: UNKNOWN }));
    expect(categoryChip()).toHaveDisplayValue("Kategori tidak ditemukan");
    expect(categoryChip()).toHaveAttribute("data-active");
  });

  it("names a chosen category hidden by the type filter", () => {
    renderToolbar(query({ type: "income", category: MAKAN }));
    expect(categoryChip()).toHaveDisplayValue("Makan");
  });

  it("says the categories are loading instead of Semua kategori", () => {
    renderToolbar(query({ category: MAKAN }), { loading: true });
    expect(categoryChip()).toHaveDisplayValue("Memuat kategori…");
  });

  it("shows Semua kategori without a category filter", () => {
    renderToolbar(query());
    expect(categoryChip()).toHaveDisplayValue("Semua kategori");
    expect(categoryChip()).not.toHaveAttribute("data-active");
  });
});

it("has no axe violations with every filter on and a range error", async () => {
  const user = userEvent.setup();
  const { container } = renderWithUrl(
    `/transactions?q=kopi&type=expense&category=${MAKAN}&from=2026-11-10&to=2026-11-20&sort=amount`,
  );
  const to = screen.getByLabelText("Sampai");
  await user.clear(to);
  await user.type(to, "2026-11-01");
  expect(to).toBeInvalid();

  expect(await axe(container)).toHaveNoViolations();
});
