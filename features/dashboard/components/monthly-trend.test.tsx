import {
  dehydrate,
  HydrationBoundary,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { transactionKeys } from "@/features/transactions/api/keys";
import { useCreateTransaction } from "@/features/transactions/api/use-create-transaction";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { MonthlyTotal, TransactionDto } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { MonthlyTrend } from "./monthly-trend";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-23";
const TREND_PATH = "/api/transactions/trend?from=2026-06&to=2026-11";
const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";

const MONTHS: MonthlyTotal[] = [
  { month: "2026-06", income: 10_578_000, expense: 6_571_000 },
  { month: "2026-07", income: 11_218_000, expense: 7_330_500 },
  { month: "2026-08", income: 11_532_500, expense: 6_249_500 },
  { month: "2026-09", income: 11_398_000, expense: 7_084_000 },
  { month: "2026-10", income: 8_500_000, expense: 6_295_500 },
  { month: "2026-11", income: 0, expense: 6_398_500 },
];
const EMPTY: MonthlyTotal[] = MONTHS.map(({ month }) => ({
  month,
  income: 0,
  expense: 0,
}));

const SUMMARY =
  "Juni–November 2026. Pemasukan tertinggi Agustus 2026: 11.532.500 rupiah. " +
  "Pengeluaran tertinggi Juli 2026: 7.330.500 rupiah. " +
  "Bulan ini, November 2026: pemasukan 0 rupiah, pengeluaran 6.398.500 rupiah.";

/** What the server hands over, under the key the page prefetches. */
function serverState(months: MonthlyTotal[]) {
  const server = new QueryClient();
  server.setQueryData(
    transactionKeys.trend({ from: "2026-06", to: "2026-11" }),
    months,
  );
  return dehydrate(server);
}

function renderHydrated(months: MonthlyTotal[], extra?: React.ReactNode) {
  return renderWithProviders(
    <HydrationBoundary state={serverState(months)}>
      <MonthlyTrend today={TODAY} />
      {extra}
    </HydrationBoundary>,
  );
}

function answerTrend(months: MonthlyTotal[]) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path === TREND_PATH) return months;
    throw new Error(`Unexpected request ${path}`);
  });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const section = () => screen.getByRole("region", { name: "Tren bulanan" });
const toggle = () =>
  within(section()).getByRole("button", { name: /Lihat (tabel|grafik)/ });

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("MonthlyTrend with the server's data", () => {
  it("shows the chart with its summary and legend at once, without asking the API", () => {
    renderHydrated(MONTHS);

    const figure = within(section()).getByRole("figure", { name: SUMMARY });
    expect(figure).toBeInTheDocument();
    expect(within(section()).getByText("Pemasukan")).toBeInTheDocument();
    expect(within(section()).getByText("Pengeluaran")).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName("Lihat tabel");
    expect(toggle()).not.toHaveAttribute("aria-pressed");
    expect(section()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("swaps the chart for a table and back, keeping focus on the button", async () => {
    const user = userEvent.setup();
    renderHydrated(MONTHS);

    await user.click(toggle());

    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();
    const table = within(section()).getByRole("table", {
      name: "Pemasukan dan pengeluaran per bulan, Juni–November 2026",
    });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(7);
    expect(
      within(rows[0]!)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toStrictEqual(["Bulan", "Pemasukan", "Pengeluaran"]);
    const november = within(rows[6]!);
    expect(november.getByRole("rowheader")).toHaveTextContent("November 2026");
    // What a screen reader says for each amount (Money's hidden label).
    const cells = november.getAllByRole("cell");
    expect(cells).toHaveLength(2);
    expect(within(cells[0]!).getByText("0 rupiah")).toBeInTheDocument();
    expect(within(cells[1]!).getByText("6.398.500 rupiah")).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName("Lihat grafik");
    const controlled = document.getElementById(
      toggle().getAttribute("aria-controls") ?? "",
    );
    expect(controlled).toContainElement(table);
    expect(toggle()).toHaveFocus();

    await user.click(toggle());

    expect(within(section()).queryByRole("table")).not.toBeInTheDocument();
    expect(within(section()).getByRole("figure")).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName("Lihat tabel");
    expect(toggle()).toHaveFocus();
  });

  it("lets the keyboard scroll a table that is wider than a phone", async () => {
    const user = userEvent.setup();
    renderHydrated(MONTHS);

    await user.click(toggle());

    // Long amounts or a 320px screen make the table scroll sideways; a
    // scrolling box must take focus so arrow keys can move it (axe rule
    // scrollable-region-focusable). It is named after the table.
    const name = "Pemasukan dan pengeluaran per bulan, Juni–November 2026";
    const scroller = within(section()).getByRole("region", { name });
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(scroller).toContainElement(
      within(section()).getByRole("table", { name }),
    );
    await user.tab();
    expect(scroller).toHaveFocus();
  });

  it("loads the trend again after a change and shows the new numbers", async () => {
    const request = deferred<TransactionDto>();
    fetchApi.mockReturnValue(request.promise);
    function AddButton() {
      const create = useCreateTransaction();
      return (
        <button
          onClick={() =>
            create.mutate({
              type: "expense",
              categoryId: MAKAN,
              amount: 1_000_000,
              date: TODAY,
              note: null,
            })
          }
        >
          Tambah
        </button>
      );
    }
    renderHydrated(MONTHS, <AddButton />);
    await userEvent.click(screen.getByRole("button", { name: "Tambah" }));

    const updated = MONTHS.map((m) =>
      m.month === "2026-11" ? { ...m, expense: 7_398_500 } : m,
    );
    fetchApi.mockImplementation(async (path: string) => {
      if (path === TREND_PATH) return updated;
      throw new Error(`Unexpected request ${path}`);
    });
    await act(async () =>
      request.resolve({
        id: "0b6e5f00-0000-4000-8000-000000000099",
        type: "expense",
        amount: 1_000_000,
        date: TODAY,
        note: null,
        category: { id: MAKAN, name: "Makan", icon: "utensils" },
        createdAt: "2026-11-23T05:00:00.000Z",
        updatedAt: "2026-11-23T05:00:00.000Z",
      }),
    );

    expect(
      await within(section()).findByRole("figure", {
        name: /pengeluaran 7\.398\.500 rupiah\.$/,
      }),
    ).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(TREND_PATH, expect.anything());
  });

  it("says so when six months have no transactions, without the table button", () => {
    renderHydrated(EMPTY);

    expect(
      within(section()).getByText(
        "Belum ada transaksi dalam 6 bulan terakhir.",
      ),
    ).toBeInTheDocument();
    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();
    expect(
      within(section()).queryByRole("button", { name: /Lihat (tabel|grafik)/ }),
    ).not.toBeInTheDocument();
  });

  it("has no axe violations as a chart or as a table", async () => {
    const user = userEvent.setup();
    const { container } = renderHydrated(MONTHS);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(toggle());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MonthlyTrend without the server's data", () => {
  it("shows a skeleton, then loads six months from the API", async () => {
    answerTrend(MONTHS);
    renderWithProviders(<MonthlyTrend today={TODAY} />);

    expect(section()).toHaveAttribute("aria-busy", "true");
    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();

    expect(
      await within(section()).findByRole("figure", { name: SUMMARY }),
    ).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(TREND_PATH, expect.anything());
  });

  it("keeps room for the table button while loading, unseen and unread", () => {
    answerTrend(MONTHS);
    renderWithProviders(<MonthlyTrend today={TODAY} />);

    // Without it the heading wraps only once the button arrives (320px)
    // and the card grows by a line (measured in the browser).
    const placeholder = within(section()).getByText("Lihat tabel");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveClass("invisible");
    expect(
      within(section()).queryByRole("button", { name: /Lihat (tabel|grafik)/ }),
    ).not.toBeInTheDocument();
  });

  it("says when it fails to load, and loads again on Coba lagi", async () => {
    const user = userEvent.setup();
    let fail = true;
    fetchApi.mockImplementation(async (path: string) => {
      if (path !== TREND_PATH) throw new Error(`Unexpected request ${path}`);
      if (fail) {
        fail = false;
        throw new ApiError({ status: 500, code: "unknown", message: "x" });
      }
      return MONTHS;
    });
    renderWithProviders(<MonthlyTrend today={TODAY} />);

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      "Tren bulanan gagal dimuat. Periksa koneksi lalu coba lagi.",
    );
    expect(
      within(section()).queryByRole("button", { name: /Lihat (tabel|grafik)/ }),
    ).not.toBeInTheDocument();

    await user.click(
      within(section()).getByRole("button", { name: "Coba lagi" }),
    );

    expect(
      await within(section()).findByRole("figure", { name: SUMMARY }),
    ).toBeInTheDocument();
    expect(within(section()).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says it waits for the connection while offline", () => {
    answerTrend(MONTHS);
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<MonthlyTrend today={TODAY} />);

    expect(
      within(section()).getByText(
        "Kamu sedang offline. Grafik dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
