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
import type { CategoryTotal, TransactionDto } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { CategoryBreakdown } from "./category-breakdown";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-23";
const CATEGORIES_PATH =
  "/api/transactions/by-category?type=expense&from=2026-11-01&to=2026-11-30";
const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";

function total(
  id: string,
  name: string,
  amount: number,
  count: number,
): CategoryTotal {
  return { category: { id, name, icon: "tag" }, total: amount, count };
}

/** November's expense as the API sends it: seven categories, largest first. */
const TOTALS: CategoryTotal[] = [
  total("cat-tagihan", "Tagihan", 3_241_500, 4),
  total(MAKAN, "Makan", 1_275_000, 30),
  total("cat-transport", "Transport", 720_000, 12),
  total("cat-belanja", "Belanja", 510_000, 3),
  total("cat-kesehatan", "Kesehatan", 300_000, 1),
  total("cat-pendidikan", "Pendidikan", 200_000, 2),
  total("cat-hiburan", "Hiburan", 161_000, 3),
];

const SUMMARY =
  "Pengeluaran November 2026: total 6.407.500 rupiah. " +
  "Dari yang terbesar: Tagihan 3.241.500 rupiah (51%), " +
  "Makan 1.275.000 rupiah (20%), Transport 720.000 rupiah (11%), " +
  "Belanja 510.000 rupiah (8%), Kesehatan 300.000 rupiah (5%), " +
  "Lainnya (2 kategori) 361.000 rupiah (6%).";

const TABLE_NAME = "Pengeluaran per kategori, November 2026";

/** What the server hands over, under the key the page prefetches. */
function serverState(totals: CategoryTotal[]) {
  const server = new QueryClient();
  server.setQueryData(
    transactionKeys.byCategory({
      type: "expense",
      from: "2026-11-01",
      to: "2026-11-30",
    }),
    totals,
  );
  return dehydrate(server);
}

function renderHydrated(totals: CategoryTotal[], extra?: React.ReactNode) {
  return renderWithProviders(
    <HydrationBoundary state={serverState(totals)}>
      <CategoryBreakdown today={TODAY} />
      {extra}
    </HydrationBoundary>,
  );
}

function answerCategories(totals: CategoryTotal[]) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path === CATEGORIES_PATH) return totals;
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

const section = () =>
  screen.getByRole("region", { name: "Pengeluaran per kategori" });
const toggle = () =>
  within(section()).getByRole("button", { name: /Lihat (tabel|grafik)/ });

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("CategoryBreakdown with the server's data", () => {
  it("shows the chart with its summary at once, without asking the API", () => {
    renderHydrated(TOTALS);

    expect(
      within(section()).getByRole("figure", { name: SUMMARY }),
    ).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName("Lihat tabel");
    expect(toggle()).not.toHaveAttribute("aria-pressed");
    expect(section()).toHaveAttribute("aria-busy", "false");
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("swaps the chart for a table of the same rows and back, keeping focus on the button", async () => {
    const user = userEvent.setup();
    renderHydrated(TOTALS);

    await user.click(toggle());

    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();
    const table = within(section()).getByRole("table", { name: TABLE_NAME });
    const rows = within(table).getAllByRole("row");
    expect(
      within(rows[0]!)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toStrictEqual(["Kategori", "Nominal", "Porsi"]);
    expect(
      rows
        .slice(1)
        .map((row) => within(row).getByRole("rowheader").textContent),
    ).toStrictEqual([
      "Tagihan",
      "Makan",
      "Transport",
      "Belanja",
      "Kesehatan",
      "Lainnya (2 kategori)",
    ]);
    // What a screen reader says for the amount (Money's hidden label).
    const other = within(rows[6]!).getAllByRole("cell");
    expect(other).toHaveLength(2);
    expect(within(other[0]!).getByText("361.000 rupiah")).toBeInTheDocument();
    expect(other[1]).toHaveTextContent("6%");
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
    renderHydrated(TOTALS);

    await user.click(toggle());

    const scroller = within(section()).getByRole("region", {
      name: TABLE_NAME,
    });
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(scroller).toContainElement(
      within(section()).getByRole("table", { name: TABLE_NAME }),
    );
    await user.tab();
    expect(scroller).toHaveFocus();
  });

  it("loads the categories again after a change and shows the new numbers", async () => {
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
              amount: 3_000_000,
              date: TODAY,
              note: null,
            })
          }
        >
          Tambah
        </button>
      );
    }
    renderHydrated(TOTALS, <AddButton />);
    await userEvent.click(screen.getByRole("button", { name: "Tambah" }));

    const updated = TOTALS.map((row) =>
      row.category.id === MAKAN ? { ...row, total: 4_275_000, count: 31 } : row,
    ).sort((a, b) => b.total - a.total);
    answerCategories(updated);
    await act(async () =>
      request.resolve({
        id: "0b6e5f00-0000-4000-8000-000000000099",
        type: "expense",
        amount: 3_000_000,
        date: TODAY,
        note: null,
        category: { id: MAKAN, name: "Makan", icon: "utensils" },
        createdAt: "2026-11-23T05:00:00.000Z",
        updatedAt: "2026-11-23T05:00:00.000Z",
      }),
    );

    expect(
      await within(section()).findByRole("figure", {
        name: /Dari yang terbesar: Makan 4\.275\.000 rupiah/,
      }),
    ).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(CATEGORIES_PATH, expect.anything());
  });

  it("says so when there is no expense this month, without the table button", () => {
    renderHydrated([]);

    expect(
      within(section()).getByText("Belum ada pengeluaran bulan ini."),
    ).toBeInTheDocument();
    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();
    expect(
      within(section()).queryByRole("button", { name: /Lihat (tabel|grafik)/ }),
    ).not.toBeInTheDocument();
  });

  it("has no axe violations as a chart or as a table", async () => {
    const user = userEvent.setup();
    const { container } = renderHydrated(TOTALS);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(toggle());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CategoryBreakdown without the server's data", () => {
  it("shows a skeleton, then loads this month's categories from the API", async () => {
    answerCategories(TOTALS);
    renderWithProviders(<CategoryBreakdown today={TODAY} />);

    expect(section()).toHaveAttribute("aria-busy", "true");
    expect(within(section()).queryByRole("figure")).not.toBeInTheDocument();

    expect(
      await within(section()).findByRole("figure", { name: SUMMARY }),
    ).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(CATEGORIES_PATH, expect.anything());
  });

  it("keeps room for the table button while loading, unseen and unread", () => {
    answerCategories(TOTALS);
    renderWithProviders(<CategoryBreakdown today={TODAY} />);

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
      if (path !== CATEGORIES_PATH) {
        throw new Error(`Unexpected request ${path}`);
      }
      if (fail) {
        fail = false;
        throw new ApiError({ status: 500, code: "unknown", message: "x" });
      }
      return TOTALS;
    });
    renderWithProviders(<CategoryBreakdown today={TODAY} />);

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      "Pengeluaran per kategori gagal dimuat. Periksa koneksi lalu coba lagi.",
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
    answerCategories(TOTALS);
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<CategoryBreakdown today={TODAY} />);

    expect(
      within(section()).getByText(
        "Kamu sedang offline. Grafik dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
