import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { AddTransactionButton } from "@/components/app-shell/add-transaction-button";
import { apiFetch } from "@/lib/api/client";
import type { CategoryDto } from "@/schemas/category";
import type { TransactionDto, TransactionInput } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";
import { setUrl } from "@/test/url-navigation";

import { TransactionDialogs } from "./transaction-dialogs";
import { TransactionList } from "./transaction-list";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));
jest.mock("next/navigation", () => jest.requireActual("@/test/url-navigation"));

const fetchApi = jest.mocked(apiFetch);

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
  {
    id: "5b3e4d60-ac9f-4e70-b182-3c4d5e6f7081",
    name: "Gaji",
    type: "income",
    icon: "wallet",
  },
];

let server: TransactionDto[];
let nextId: number;

function toDto(id: string, input: TransactionInput): TransactionDto {
  const category = categories.find((c) => c.id === input.categoryId);
  return {
    id,
    type: input.type,
    amount: input.amount,
    date: input.date,
    note: input.note ?? null,
    category: {
      id: input.categoryId,
      name: category?.name ?? "",
      icon: category?.icon ?? "tag",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// A tiny in-memory API, so refetches after a mutation return the new truth.
beforeEach(() => {
  setUrl("/transactions");
  nextId = 1;
  server = [
    toDto("00000000-0000-4000-8000-000000000001", {
      type: "expense",
      categoryId: MAKAN,
      amount: 35_000,
      date: "2026-11-01",
      note: "Makan siang",
    }),
  ];
  fetchApi.mockImplementation(async (path, init) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const id = path.split("/")[3]?.split("?")[0];
    if (path === "/api/categories") return categories;
    if (path.startsWith("/api/transactions/summary")) {
      const sum = (type: string) => {
        const rows = server.filter((t) => t.type === type);
        return {
          total: rows.reduce((total, t) => total + t.amount, 0),
          count: rows.length,
        };
      };
      const income = sum("income");
      const expense = sum("expense");
      return { income, expense, balance: income.total - expense.total };
    }
    // The list: "/api/transactions", with or without a query string.
    if (method === "GET" && /^\/api\/transactions(\?|$)/.test(path)) {
      return { data: server, page: 1, pageSize: 20, total: server.length };
    }
    if (method === "POST") {
      nextId += 1;
      const created = toDto(
        `00000000-0000-4000-8000-00000000000${nextId}`,
        body,
      );
      server = [created, ...server];
      return created;
    }
    if (method === "PATCH" && id) {
      const updated = toDto(id, body);
      server = server.map((t) => (t.id === id ? updated : t));
      return updated;
    }
    if (method === "DELETE" && id) {
      server = server.filter((t) => t.id !== id);
      return undefined;
    }
    return server.find((t) => t.id === id);
  });
});

afterEach(() => fetchApi.mockReset());

function setup() {
  return renderWithProviders(
    <>
      <AddTransactionButton />
      <TransactionList />
      <TransactionDialogs />
    </>,
  );
}

const table = () => screen.getByRole("table", { name: "Daftar transaksi" });

describe("transaction dialogs (desktop)", () => {
  it("adds a transaction from the header button", async () => {
    setup();
    await screen.findByRole("table", { name: "Daftar transaksi" });

    await userEvent.click(
      screen.getByRole("button", { name: "Tambah transaksi" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Tambah transaksi",
    });
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Nominal" }),
      "12000",
    );
    await userEvent.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
      "Makan",
    );
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Catatan (opsional)" }),
      "Kopi",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(within(table()).getByText("Kopi")).toBeInTheDocument();
    expect(await screen.findByText("Transaksi disimpan")).toBeInTheDocument();
  });

  it("edits a row from its Ubah button", async () => {
    setup();
    await userEvent.click(
      await screen.findByRole("button", { name: "Ubah Makan siang" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Ubah transaksi",
    });
    const amount = await within(dialog).findByRole("textbox", {
      name: "Nominal",
    });
    expect(amount).toHaveValue("35.000");

    await userEvent.clear(amount);
    await userEvent.type(amount, "40000");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan perubahan" }),
    );

    await waitFor(() =>
      expect(within(table()).getByText("40.000")).toBeInTheDocument(),
    );
  });

  it("deletes a row after confirming, and can undo it", async () => {
    setup();
    await userEvent.click(
      await screen.findByRole("button", { name: "Hapus Makan siang" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Hapus transaksi ini?",
    });
    expect(dialog).toHaveTextContent("Makan · 1 Nov 2026");
    expect(dialog).toHaveTextContent(
      "Saldo dan budget Makan bulan ini akan dihitung ulang.",
    );

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Hapus" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("table")).not.toBeInTheDocument(),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Urungkan" }),
    );

    expect(
      await screen.findByText("Transaksi dikembalikan"),
    ).toBeInTheDocument();
    expect(
      await within(
        await screen.findByRole("table", { name: "Daftar transaksi" }),
      ).findByText("Makan siang"),
    ).toBeInTheDocument();
  });

  it("goes from the edit form to the delete confirmation", async () => {
    setup();
    await userEvent.click(
      await screen.findByRole("button", { name: "Ubah Makan siang" }),
    );
    const form = await screen.findByRole("dialog", { name: "Ubah transaksi" });
    await userEvent.click(
      await within(form).findByRole("button", { name: "Hapus transaksi" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Hapus transaksi ini?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Ubah transaksi" }),
    ).not.toBeInTheDocument();
  });

  it("has no axe violations in the open form", async () => {
    const { container } = setup();
    await screen.findByRole("table", { name: "Daftar transaksi" });
    await userEvent.click(
      screen.getByRole("button", { name: "Tambah transaksi" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Tambah transaksi",
    });
    await within(dialog).findByRole("combobox", { name: "Kategori" });

    expect(await axe(container)).toHaveNoViolations();
  });
});
