import { onlineManager } from "@tanstack/react-query";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ApiError, apiFetch } from "@/lib/api/client";
import { todayInJakarta } from "@/lib/date";
import type { TransactionDto, TransactionPage } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { TransactionList } from "./transaction-list";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

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
    category: { id: "c-makan", name: "Makan", icon: "utensils" },
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
      category: { id: "c-gaji", name: "Gaji", icon: "wallet" },
    }),
    transaction({
      date: daysAgo(1),
      note: "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
      amount: 50_000,
      category: { id: "c-transport", name: "Transport", icon: "bus" },
    }),
  ],
  page: 1,
  pageSize: 20,
  total: 3,
};

const empty: TransactionPage = { data: [], page: 1, pageSize: 20, total: 0 };

afterEach(() => {
  fetchApi.mockReset();
  act(() => onlineManager.setOnline(true));
});

describe("TransactionList", () => {
  it("asks the API for the first page and passes the abort signal", async () => {
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    await screen.findByRole("table", { name: "Daftar transaksi" });

    expect(fetchApi).toHaveBeenCalledWith(
      "/api/transactions?page=1&pageSize=20",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("shows a skeleton while loading", () => {
    fetchApi.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<TransactionList />);

    expect(screen.getByText("Memuat transaksi…")).toHaveAttribute(
      "role",
      "status",
    );
    expect(screen.getByTestId("transaction-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("lists the transactions in a table for wide screens", async () => {
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    const table = await screen.findByRole("table", {
      name: "Daftar transaksi",
    });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent("Makan siang");
    expect(rows[1]).toHaveTextContent("−Rp35.000");
    // No note: the category names the row.
    expect(rows[2]).toHaveTextContent("Gaji");
    expect(rows[2]).toHaveTextContent("+Rp8.500.000");
  });

  it("groups the transactions by day for phones", async () => {
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    const today = await screen.findByRole("heading", { name: /^Hari ini · / });
    const yesterday = screen.getByRole("heading", { name: /^Kemarin · / });

    const todayList = today.parentElement?.querySelector("ul");
    const yesterdayList = yesterday.parentElement?.querySelector("ul");
    expect(todayList?.children).toHaveLength(2);
    expect(yesterdayList?.children).toHaveLength(1);
  });

  it("links each row on phones to its edit page", async () => {
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    const link = await screen.findByRole("link", { name: /Makan siang/ });
    expect(link).toHaveAttribute(
      "href",
      `/transactions/${page.data[0]?.id}/edit`,
    );
  });

  it("keeps the full text of a long note in its title", async () => {
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    const notes = await screen.findAllByText(
      "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
    );
    for (const note of notes) {
      expect(note).toHaveAttribute(
        "title",
        "Bensin motor ke kantor dan pulang lagi lewat jalan memutar",
      );
    }
  });

  it("says how many of how many are shown", async () => {
    fetchApi.mockResolvedValue({ ...page, total: 178 });
    renderWithProviders(<TransactionList />);

    expect(
      (await screen.findAllByText("Menampilkan 1–3 dari 178 transaksi")).length,
    ).toBeGreaterThan(0);
  });

  it("shows an error with a way to try again", async () => {
    fetchApi.mockRejectedValueOnce(
      new ApiError({ status: 500, code: "unknown", message: "x" }),
    );
    fetchApi.mockResolvedValueOnce(page);
    renderWithProviders(<TransactionList />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Transaksi gagal dimuat. Periksa koneksi lalu coba lagi.",
    );

    await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(
      await screen.findByRole("table", { name: "Daftar transaksi" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("invites a new user to add the first transaction", async () => {
    fetchApi.mockResolvedValue(empty);
    renderWithProviders(<TransactionList />);

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
    fetchApi.mockResolvedValue(page);
    renderWithProviders(<TransactionList />);

    expect(
      await screen.findByText(
        "Kamu sedang offline. Transaksi dimuat otomatis saat koneksi kembali.",
      ),
    ).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();

    act(() => onlineManager.setOnline(true));

    expect(
      await screen.findByRole("table", { name: "Daftar transaksi" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["the list", () => fetchApi.mockResolvedValue(page), "table"],
    ["the empty state", () => fetchApi.mockResolvedValue(empty), "link"],
    [
      "the error",
      () =>
        fetchApi.mockRejectedValue(
          new ApiError({ status: 500, code: "unknown", message: "x" }),
        ),
      "alert",
    ],
  ] as const)("has no axe violations in %s", async (_name, arrange, role) => {
    arrange();
    const { container } = renderWithProviders(<TransactionList />);
    await screen.findAllByRole(role);

    expect(await axe(container)).toHaveNoViolations();
  });
});
