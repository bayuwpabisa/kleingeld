import { onlineManager } from "@tanstack/react-query";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ApiError, apiFetch } from "@/lib/api/client";
import { shortDate, todayInJakarta } from "@/lib/date";
import type { CategoryDto } from "@/schemas/category";
import type {
  TransactionDto,
  TransactionPage,
  TransactionSummary,
} from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";
import { setUrl } from "@/test/url-navigation";
import { PHONE_WIDTH, setViewportWidth } from "@/test/viewport";

import { recentMonths } from "../periods";
import { TransactionList } from "./transaction-list";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));
jest.mock("next/navigation", () => jest.requireActual("@/test/url-navigation"));

const fetchApi = jest.mocked(apiFetch);

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const TRANSPORT = "4a2d3c5f-9b8e-4d6f-a071-2b3c4d5e6f70";
const GAJI = "5b3e4d60-ac9f-4e70-b182-3c4d5e6f7081";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
  { id: TRANSPORT, name: "Transport", type: "expense", icon: "bus" },
  { id: GAJI, name: "Gaji", type: "income", icon: "wallet" },
];

function daysAgo(days: number) {
  const date = new Date(`${todayInJakarta()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function transaction(overrides: Partial<TransactionDto>): TransactionDto {
  return {
    id: crypto.randomUUID(),
    type: "expense",
    amount: 35_000,
    date: daysAgo(0),
    note: "Makan siang",
    category: { id: MAKAN, name: "Makan", icon: "utensils" },
    createdAt: "2026-11-15T05:00:00.000Z",
    updatedAt: "2026-11-15T05:00:00.000Z",
    ...overrides,
  };
}

const page: TransactionPage = {
  data: [
    transaction({ note: "Makan siang" }),
    transaction({
      type: "income",
      amount: 8_500_000,
      note: null,
      category: { id: GAJI, name: "Gaji", icon: "wallet" },
    }),
    transaction({
      date: daysAgo(1),
      note: "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
      amount: 50_000,
      category: { id: TRANSPORT, name: "Transport", icon: "bus" },
    }),
  ],
  page: 1,
  pageSize: 20,
  total: 3,
};

const empty: TransactionPage = { data: [], page: 1, pageSize: 20, total: 0 };

const summary: TransactionSummary = {
  income: { total: 8_500_000, count: 1 },
  expense: { total: 85_000, count: 2 },
  balance: 8_415_000,
};

type ListAnswer =
  TransactionPage | ((path: string) => Promise<TransactionPage>);

/**
 * A tiny API: categories, the summary (or its failure), and the list (a page
 * or a function).
 */
function respond(
  list: ListAnswer = page,
  answerSummary: () => Promise<TransactionSummary> = async () => summary,
) {
  fetchApi.mockImplementation(async (path: string) => {
    if (path === "/api/categories") return categories;
    if (path.startsWith("/api/transactions/summary")) return answerSummary();
    if (path.startsWith("/api/transactions")) {
      return typeof list === "function" ? list(path) : list;
    }
    throw new Error(`Unexpected request ${path}`);
  });
}

/** The list requests made so far, without the summary and categories. */
function listRequests() {
  return fetchApi.mock.calls
    .map(([path]) => path)
    .filter(
      (path) =>
        path.startsWith("/api/transactions") &&
        !path.startsWith("/api/transactions/summary"),
    );
}

function setup(url = "/transactions") {
  setUrl(url);
  return renderWithProviders(<TransactionList />);
}

const table = () => screen.findByRole("table", { name: "Daftar transaksi" });

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("TransactionList on desktop", () => {
  it("asks for the default list and passes the abort signal", async () => {
    respond();
    setup();

    await table();

    // The defaults (newest first, page 1 of 20) need no parameters.
    expect(fetchApi).toHaveBeenCalledWith("/api/transactions", {
      signal: expect.any(AbortSignal),
    });
    expect(fetchApi).toHaveBeenCalledWith("/api/transactions/summary", {
      signal: expect.any(AbortSignal),
    });
  });

  it("shows a skeleton while loading", () => {
    respond(() => new Promise(() => {}));
    setup();

    expect(screen.getAllByText("Memuat transaksi…")[0]).toHaveAttribute(
      "role",
      "status",
    );
    expect(screen.getByTestId("transaction-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("lists the transactions in a table", async () => {
    respond();
    setup();

    const rows = within(await table()).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent("Makan siang");
    expect(rows[1]).toHaveTextContent("−Rp35.000");
    // No note: the category names the row.
    expect(rows[2]).toHaveTextContent("Gaji");
    expect(rows[2]).toHaveTextContent("+Rp8.500.000");
    // Only one list is mounted, so the phone groups are not there.
    expect(screen.queryByRole("heading", { name: /^Hari ini/ })).toBeNull();
  });

  it("keeps the full text of a long note in its title", async () => {
    respond();
    setup();

    const note = await screen.findByText(
      "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
    );
    expect(note).toHaveAttribute(
      "title",
      "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
    );
  });

  it("shows the summary of the filtered transactions", async () => {
    respond();
    setup();

    const cards = await screen.findByRole("region", { name: "Ringkasan" });
    await within(cards).findByText("Pemasukan");
    expect(cards).toHaveTextContent("PemasukanRp8.500.000");
    expect(cards).toHaveTextContent("1 transaksi");
    expect(cards).toHaveTextContent("PengeluaranRp85.000");
    expect(cards).toHaveTextContent("2 transaksi");
    expect(cards).toHaveTextContent("SaldoRp8.415.000");
    expect(cards).toHaveTextContent("Semua waktu");
  });

  it("reads the filters and order from the URL", async () => {
    respond();
    setup(`/transactions?type=expense&category=${MAKAN}&sort=amount&page=2`);

    await table();
    expect(listRequests()).toContain(
      `/api/transactions?type=expense&category=${MAKAN}&sort=amount&page=2`,
    );
    expect(fetchApi).toHaveBeenCalledWith(
      `/api/transactions/summary?type=expense&category=${MAKAN}`,
      expect.anything(),
    );
    expect(screen.getByRole("radio", { name: "Pengeluaran" })).toBeChecked();
    expect(
      screen.getByRole("combobox", { name: "Urutkan" }),
    ).toHaveDisplayValue("Nominal terbesar");
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Kategori" }),
      ).toHaveDisplayValue("Makan"),
    );
  });

  it("searches once typing stops, without a request per letter", async () => {
    const user = userEvent.setup();
    respond();
    setup();
    await table();

    await user.type(
      screen.getByRole("searchbox", { name: "Cari transaksi" }),
      "kopi",
    );

    await waitFor(() => expect(window.location.search).toBe("?q=kopi"));
    await waitFor(() =>
      expect(listRequests()).toContain("/api/transactions?q=kopi"),
    );
    expect(listRequests().filter((path) => path.includes("q="))).toEqual([
      "/api/transactions?q=kopi",
    ]);
  });

  it("searches at once on Enter", async () => {
    const user = userEvent.setup();
    respond();
    setup();
    await table();

    await user.type(
      screen.getByRole("searchbox", { name: "Cari transaksi" }),
      "gaji{Enter}",
    );

    expect(window.location.search).toBe("?q=gaji");
  });

  it("filters by type from page 1, and drops a category of the other type", async () => {
    const user = userEvent.setup();
    respond();
    setup(`/transactions?category=${MAKAN}&page=2`);
    await table();

    await user.click(screen.getByRole("radio", { name: "Pemasukan" }));

    expect(window.location.search).toBe("?type=income");
  });

  it("offers only the categories of the chosen type", async () => {
    respond();
    setup("/transactions?type=income");
    await table();

    const select = screen.getByRole("combobox", { name: "Kategori" });
    await waitFor(() =>
      expect(within(select).getAllByRole("option")).toHaveLength(2),
    );
    expect(within(select).getByRole("option", { name: "Gaji" })).toBeVisible();
  });

  it("sorts by a column header, then flips the order", async () => {
    const user = userEvent.setup();
    respond();
    setup();

    const header = within(await table()).getByRole("columnheader", {
      name: "Nominal",
    });
    expect(header).not.toHaveAttribute("aria-sort");
    expect(
      within(await table()).getByRole("columnheader", { name: "Tanggal" }),
    ).toHaveAttribute("aria-sort", "descending");

    await user.click(within(header).getByRole("button", { name: "Nominal" }));
    expect(window.location.search).toBe("?sort=amount");
    await waitFor(() =>
      expect(header).toHaveAttribute("aria-sort", "descending"),
    );

    await user.click(within(header).getByRole("button", { name: "Nominal" }));
    expect(window.location.search).toBe("?sort=amount&order=asc");
  });

  it("pages through the results", async () => {
    const user = userEvent.setup();
    respond(async (path) =>
      path.includes("page=2")
        ? { ...page, page: 2, total: 45 }
        : { ...page, total: 45 },
    );
    setup();
    await table();

    expect(screen.getByText("Menampilkan 1–3 dari 45 transaksi")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Halaman 2" }));

    expect(window.location.search).toBe("?page=2");
    expect(
      await screen.findByText("Menampilkan 21–23 dari 45 transaksi"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Halaman 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("goes to the last page when the URL asks for one past the end", async () => {
    const before = window.history.length;
    respond(async (path) =>
      path.includes("page=9") ? { ...empty, page: 9, total: 3 } : page,
    );
    setup("/transactions?type=expense&page=9");

    await waitFor(() => expect(window.location.search).toBe("?type=expense"));
    expect(window.history.length).toBe(before);
    await table();
  });

  it("names the filters when nothing matches, and clears them", async () => {
    const user = userEvent.setup();
    respond(async (path) => (path.includes("q=") ? empty : page));
    const months = recentMonths(todayInJakarta());
    const month = months[1];
    if (!month) throw new Error("no month");
    const lastDay = new Date(
      Date.UTC(
        Number(month.value.slice(0, 4)),
        Number(month.value.slice(5)),
        0,
      ),
    ).getUTCDate();
    setup(
      `/transactions?q=kopi&from=${month.value}-01&to=${month.value}-${lastDay}&sort=amount`,
    );

    expect(
      await screen.findByText(
        `Tidak ada transaksi untuk “kopi” di ${month.label}.`,
      ),
    ).toBeVisible();
    expect(
      await screen.findByText("0 transaksi ditemukan"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hapus filter" }));

    expect(window.location.search).toBe("?sort=amount");
    expect(
      screen.getByRole("searchbox", { name: "Cari transaksi" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Periode" }),
    ).toHaveDisplayValue("Semua waktu");
    await table();
  });

  it("closes empty date fields and keeps the focus when the filters are cleared", async () => {
    const user = userEvent.setup();
    respond(async (path) => (path.includes("q=") ? empty : page));
    setup("/transactions?q=kopi");
    await screen.findByText("Tidak ada transaksi untuk “kopi”.");

    // The date fields are open, but no date is set yet.
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Periode" }),
      "Rentang tanggal…",
    );
    expect(screen.getByLabelText("Dari")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hapus filter" }));

    expect(window.location.search).toBe("");
    expect(screen.queryByLabelText("Dari")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Periode" }),
    ).toHaveDisplayValue("Semua waktu");
    // The button is gone, so the focus goes to the start of the filters
    // instead of being lost.
    expect(
      screen.getByRole("searchbox", { name: "Cari transaksi" }),
    ).toHaveFocus();
  });

  it("filters by a month of the period list", async () => {
    const user = userEvent.setup();
    respond();
    setup();
    await table();
    const month = recentMonths(todayInJakarta())[0];
    if (!month) throw new Error("no month");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Periode" }),
      month.label,
    );

    expect(window.location.search).toMatch(
      new RegExp(`^\\?from=${month.value}-01&to=${month.value}-\\d\\d$`),
    );
  });

  it("filters by a range of dates, and explains a reversed range", async () => {
    const user = userEvent.setup();
    respond();
    setup();
    await table();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Periode" }),
      "Rentang tanggal…",
    );
    const from = screen.getByLabelText("Dari");
    const to = screen.getByLabelText("Sampai");

    await user.type(from, "2026-11-10");
    expect(window.location.search).toBe("?from=2026-11-10");

    await user.type(to, "2026-11-01");
    expect(to).toHaveAccessibleDescription(
      "Tanggal awal harus sebelum tanggal akhir",
    );
    expect(window.location.search).toBe("?from=2026-11-10");

    await user.clear(to);
    await user.type(to, "2026-11-20");
    expect(window.location.search).toBe("?from=2026-11-10&to=2026-11-20");
  });

  it("shows an error with a way to try again", async () => {
    const user = userEvent.setup();
    let fail = true;
    respond(async () => {
      if (fail) {
        fail = false;
        throw new ApiError({ status: 500, code: "unknown", message: "x" });
      }
      return page;
    });
    setup();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Transaksi gagal dimuat. Periksa koneksi lalu coba lagi.",
    );

    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await table()).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the list when only the summary fails", async () => {
    respond(page, async () => {
      throw new ApiError({ status: 500, code: "unknown", message: "x" });
    });
    setup();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ringkasan gagal dimuat.",
    );
    expect(within(await table()).getByText("Makan siang")).toBeInTheDocument();
  });

  it("invites a new user to add the first transaction", async () => {
    respond(empty);
    setup();

    expect(
      await screen.findByText(
        "Belum ada transaksi. Catat pengeluaran pertamamu supaya dashboard mulai terisi.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tambah transaksi" }),
    ).toHaveAttribute("href", "/transactions/new");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("says when it waits for the connection instead of loading forever", async () => {
    act(() => onlineManager.setOnline(false));
    respond();
    setup();

    expect(
      await screen.findByText(
        "Kamu sedang offline. Transaksi dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();

    act(() => onlineManager.setOnline(true));

    expect(await table()).toBeInTheDocument();
  });

  it.each([
    ["the list", () => respond(), "table"],
    ["the empty state", () => respond(empty), "link"],
    [
      "nothing found",
      () => respond(async (path) => (path.includes("q=") ? empty : page)),
      "searchbox",
    ],
    [
      "the error",
      () =>
        respond(async () => {
          throw new ApiError({ status: 500, code: "unknown", message: "x" });
        }),
      "alert",
    ],
  ] as const)("has no axe violations in %s", async (name, arrange, role) => {
    arrange();
    const { container } = setup(
      name === "nothing found" ? "/transactions?q=kopi" : "/transactions",
    );
    await screen.findAllByRole(role);
    if (name === "nothing found") await screen.findByText(/Tidak ada/);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TransactionList on phones", () => {
  beforeEach(() => setViewportWidth(PHONE_WIDTH));

  it("groups the transactions by day", async () => {
    respond();
    setup();

    const today = await screen.findByRole("heading", { name: /^Hari ini · / });
    const yesterday = screen.getByRole("heading", { name: /^Kemarin · / });

    expect(today.parentElement?.querySelector("ul")?.children).toHaveLength(2);
    expect(yesterday.parentElement?.querySelector("ul")?.children).toHaveLength(
      1,
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("links each row to its edit page", async () => {
    respond();
    setup();

    const link = await screen.findByRole("link", { name: /Makan siang/ });
    expect(link).toHaveAttribute(
      "href",
      `/transactions/${page.data[0]?.id}/edit`,
    );
  });

  it("loads more rows until all are shown", async () => {
    const user = userEvent.setup();
    const second: TransactionPage = {
      ...page,
      page: 2,
      total: 23,
      data: [transaction({ note: "Parkir", date: daysAgo(5) })],
    };
    respond(async (path) =>
      path.includes("page=2") ? second : { ...page, total: 23 },
    );
    setup("/transactions?type=expense&page=4");

    expect(
      await screen.findByText("Menampilkan 3 dari 23 transaksi"),
    ).toBeVisible();
    // The phone list ignores the desktop page in the URL.
    expect(listRequests()[0]).toBe("/api/transactions?type=expense");

    await user.click(screen.getByRole("button", { name: "Muat lebih banyak" }));

    expect(await screen.findByText("Parkir")).toBeVisible();
    expect(screen.getByText("Menampilkan 4 dari 23 transaksi")).toBeVisible();
    expect(listRequests()).toContain("/api/transactions?type=expense&page=2");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Muat lebih banyak" }),
      ).toBeNull(),
    );
  });

  it("has no axe violations", async () => {
    respond({ ...page, total: 30 });
    const { container } = setup();
    await screen.findByRole("button", { name: "Muat lebih banyak" });

    expect(await axe(container)).toHaveNoViolations();
  });

  // Sorted by amount, one date can come back several times (today, yesterday,
  // today). Day headings would repeat, so the list has none and each row
  // names its date first, so a long category is cut off before the date is
  // (DESIGN.md, Daftar transaksi (HP)).
  const day = (daysBack: number) => shortDate(daysAgo(daysBack), daysAgo(0));
  const byAmount: TransactionPage = {
    ...page,
    data: [
      transaction({ note: "Sewa kos", amount: 1_500_000 }),
      transaction({ note: "Bensin", amount: 80_000, date: daysAgo(1) }),
      transaction({ note: "Kopi", amount: 25_000 }),
    ],
  };

  it("lists the rows without day headings when sorted by amount", async () => {
    respond(byAmount);
    setup("/transactions?sort=amount");

    const list = await screen.findByRole("list", { name: "Daftar transaksi" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toStrictEqual([
      expect.stringContaining(`Sewa kos${day(0)} · Makan`),
      expect.stringContaining(`Bensin${day(1)} · Makan`),
      expect.stringContaining(`Kopi${day(0)} · Makan`),
    ]);
    expect(
      screen.queryByRole("heading", { name: /^(Hari ini|Kemarin) · / }),
    ).toBeNull();
  });

  it("keeps the day headings when sorted by date, oldest first", async () => {
    respond({
      ...page,
      data: [
        transaction({ note: "Bensin", date: daysAgo(1) }),
        transaction({ note: "Sewa kos" }),
        transaction({ note: "Kopi" }),
      ],
    });
    setup("/transactions?order=asc");

    await screen.findByRole("heading", { name: /^Kemarin · / });
    const days = screen
      .getAllByRole("heading", { name: /^(Hari ini|Kemarin) · / })
      .map((heading) => heading.textContent?.split(" · ")[0]);
    expect(days).toStrictEqual(["Kemarin", "Hari ini"]);
  });

  it("has no axe violations when sorted by amount", async () => {
    respond(byAmount);
    const { container } = setup("/transactions?sort=amount");
    await screen.findByText("Sewa kos");

    expect(await axe(container)).toHaveNoViolations();
  });
});
