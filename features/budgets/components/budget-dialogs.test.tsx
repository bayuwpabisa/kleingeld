import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Activity } from "react";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  budgetInputSchema,
  budgetUpdateSchema,
  type BudgetInput,
  type BudgetStatus,
} from "@/schemas/budget";
import type { CategoryDto } from "@/schemas/category";
import type { CategoryTotal } from "@/schemas/transaction";
import { renderWithProviders } from "@/test/render-with-providers";

import { BudgetEditorProvider, CreateBudgetButton } from "./budget-editor";
import { Budgets } from "./budgets";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const TODAY = "2026-11-26";

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const TRANSPORT = "5b3e4d60-ac9f-4e70-b182-3c4d5e6f7081";
const HIBURAN = "7d5f6a80-ce1b-4a92-b3a4-5e6f708192a3";
const GAJI = "9f7b8ca2-e03d-4cb4-85c6-708192a3b4c5";

const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
  { id: TRANSPORT, name: "Transport", type: "expense", icon: "bus" },
  { id: HIBURAN, name: "Hiburan", type: "expense", icon: "film" },
  { id: GAJI, name: "Gaji", type: "income", icon: "wallet" },
];

// This month's expenses per category (GET /api/transactions/by-category).
const SPENT: Record<string, number> = {
  [MAKAN]: 1_059_000,
  [TRANSPORT]: 400_500,
  [HIBURAN]: 85_000,
};

type Row = { id: string; categoryId: string; amount: number };

let rows: Row[];
let nextId: number;

function categoryOf(id: string) {
  const found = categories.find((category) => category.id === id);
  if (!found) throw new Error(`No category ${id}`);
  return found;
}

function status(row: Row): BudgetStatus {
  const { name, icon } = categoryOf(row.categoryId);
  return {
    id: row.id,
    category: { id: row.categoryId, name, icon },
    amount: row.amount,
    spent: SPENT[row.categoryId] ?? 0,
    count: 3,
  };
}

function totals(): CategoryTotal[] {
  return Object.entries(SPENT).map(([id, total]) => {
    const { name, icon } = categoryOf(id);
    return { category: { id, name, icon }, total, count: 3 };
  });
}

function createRow(input: BudgetInput) {
  if (rows.some((row) => row.categoryId === input.categoryId)) {
    throw new ApiError({
      status: 409,
      code: "conflict",
      message: "Kategori ini sudah punya budget",
      fieldErrors: { categoryId: ["Kategori ini sudah punya budget"] },
    });
  }
  nextId += 1;
  const row = {
    id: `00000000-0000-4000-8000-${String(nextId).padStart(12, "0")}`,
    ...input,
  };
  rows = [...rows, row];
  return { id: row.id, category: status(row).category, amount: row.amount };
}

// A tiny in-memory API, so refetches after a mutation return the new truth.
beforeEach(() => {
  nextId = 10;
  rows = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      categoryId: MAKAN,
      amount: 1_250_000,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      categoryId: TRANSPORT,
      amount: 360_000,
    },
  ];
  fetchApi.mockImplementation(async (path, init) => {
    const method = init?.method ?? "GET";
    const body: unknown = init?.body
      ? JSON.parse(String(init.body))
      : undefined;
    if (path === "/api/categories") return categories;
    if (path.startsWith("/api/transactions/by-category")) return totals();
    if (path === "/api/budgets?month=2026-11") {
      return rows
        .map(status)
        .sort((a, b) => a.category.name.localeCompare(b.category.name));
    }
    if (method === "POST" && path === "/api/budgets") {
      return createRow(budgetInputSchema.parse(body));
    }
    const id = path.split("/")[3];
    const row = rows.find((r) => r.id === id);
    if (method === "PATCH" && row) {
      const { amount } = budgetUpdateSchema.parse(body);
      rows = rows.map((r) => (r.id === id ? { ...r, amount } : r));
      return { id: row.id, category: status(row).category, amount };
    }
    if (method === "DELETE" && row) {
      rows = rows.filter((r) => r.id !== id);
      return undefined;
    }
    throw new Error(`Unexpected ${method} ${path}`);
  });
});

afterEach(() => fetchApi.mockReset());

function page({ header = true }: { header?: boolean } = {}) {
  return (
    <BudgetEditorProvider>
      {header && <CreateBudgetButton />}
      <Budgets today={TODAY} />
    </BudgetEditorProvider>
  );
}

function setup(options?: { header?: boolean }) {
  return renderWithProviders(page(options));
}

/** A request the test answers later, to see the busy state in between. */
function holdNext(method: "POST" | "DELETE") {
  const answer = fetchApi.getMockImplementation();
  let held: { release: () => void; fail: (error: unknown) => void } | null =
    null;
  fetchApi.mockImplementation((path, init) => {
    if ((init?.method ?? "GET") !== method || !answer) {
      return answer ? answer(path, init) : Promise.reject(new Error("none"));
    }
    return new Promise((resolve, reject) => {
      held = { release: () => resolve(answer(path, init)), fail: reject };
    });
  });
  function request() {
    if (!held) throw new Error(`No ${method} was sent`);
    return held;
  }
  return {
    release: () => request().release(),
    fail: (error: unknown) => request().fail(error),
  };
}

const writes = (method: string) =>
  fetchApi.mock.calls.filter(([, init]) => init?.method === method);

const headerButton = () => screen.getByRole("button", { name: "Buat budget" });

async function openCreate() {
  await screen.findByRole("meter", { name: "Makan" });
  await userEvent.click(headerButton());
  return screen.findByRole("dialog", { name: "Buat budget" });
}

async function openEdit(name: string) {
  await userEvent.click(
    await screen.findByRole("button", { name: `Atur budget ${name}` }),
  );
  return screen.findByRole("dialog", { name: "Atur budget" });
}

const limitField = (dialog: HTMLElement) =>
  within(dialog).getByRole("textbox", { name: "Batas per bulan" });

describe("Buat budget", () => {
  it("offers only expense categories that have no budget yet", async () => {
    setup();
    const dialog = await openCreate();

    const select = await within(dialog).findByRole("combobox", {
      name: "Kategori",
    });
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toStrictEqual(["Pilih kategori", "Hiburan"]);
    expect(
      within(dialog).queryByRole("button", { name: "Hapus budget" }),
    ).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      "Peringatan muncul saat pemakaian mencapai 80% dan saat melewati batas.",
    );
  });

  it("shows the month's spending as the limit is typed", async () => {
    setup();
    const dialog = await openCreate();
    expect(
      await within(dialog).findByText(
        "Pilih kategori untuk melihat pemakaiannya bulan ini.",
      ),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
      "Hiburan",
    );
    expect(
      await within(dialog).findByText("85.000 rupiah"),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/terpakai bulan ini/);
    expect(within(dialog).queryByRole("meter")).not.toBeInTheDocument();

    await userEvent.type(limitField(dialog), "100000");
    expect(
      within(dialog).getByRole("meter", { name: "Hiburan" }),
    ).toHaveAttribute("aria-valuetext", "85% · hampir habis");

    // An emptied limit has no share: back to the spending alone.
    await userEvent.clear(limitField(dialog));
    expect(within(dialog).queryByRole("meter")).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent(/terpakai bulan ini/);

    await userEvent.type(limitField(dialog), "50000");
    expect(
      within(dialog).getByRole("meter", { name: "Hiburan" }),
    ).toHaveAttribute("aria-valuetext", "170% · lewat batas");
  });

  it("saves, closes, shows the new budget and returns focus to the button", async () => {
    setup();
    const dialog = await openCreate();
    await userEvent.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
      "Hiburan",
    );
    await userEvent.type(limitField(dialog), "300000");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(writes("POST")).toHaveLength(1);
    expect(writes("POST")[0]?.[1]?.body).toBe(
      JSON.stringify({ categoryId: HIBURAN, amount: 300_000 }),
    );
    expect(await screen.findByText("Budget disimpan")).toBeInTheDocument();
    expect(
      await screen.findByRole("meter", { name: "Hiburan" }),
    ).toHaveAttribute("aria-valuetext", "28% terpakai");
    expect(headerButton()).toHaveFocus();
  });

  it("is busy until the server answers", async () => {
    setup();
    const dialog = await openCreate();
    await userEvent.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
      "Hiburan",
    );
    await userEvent.type(limitField(dialog), "300000");
    const request = holdNext("POST");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );

    const save = within(dialog).getByRole("button", { name: "Simpan budget" });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute("aria-busy", "true");
    expect(dialog).toBeInTheDocument();

    request.release();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("checks the fields before sending anything", async () => {
    setup();
    const dialog = await openCreate();
    await within(dialog).findByRole("combobox", { name: "Kategori" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );

    // "Pilih kategori" is also the placeholder option, so read the errors
    // from the fields they describe.
    const select = within(dialog).getByRole("combobox", { name: "Kategori" });
    await waitFor(() =>
      expect(select).toHaveAccessibleDescription("Pilih kategori"),
    );
    expect(limitField(dialog)).toHaveAccessibleDescription("Isi nominal");
    expect(select).toHaveFocus();
    expect(writes("POST")).toHaveLength(0);
  });

  it("stays open and says why when saving fails", async () => {
    setup();
    const dialog = await openCreate();
    await userEvent.selectOptions(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
      "Hiburan",
    );
    await userEvent.type(limitField(dialog), "300000");
    const request = holdNext("POST");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );
    request.fail(new TypeError("Failed to fetch"));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Budget gagal disimpan. Periksa koneksi lalu coba lagi.",
    );
    expect(screen.getByRole("dialog", { name: "Buat budget" })).toBe(dialog);
    expect(limitField(dialog)).toHaveValue("300.000");
    expect(screen.queryByText("Budget disimpan")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    ).toBeEnabled();
  });

  it("shows a budget made elsewhere on the category field", async () => {
    setup();
    const dialog = await openCreate();
    const select = await within(dialog).findByRole("combobox", {
      name: "Kategori",
    });
    await userEvent.selectOptions(select, "Hiburan");
    await userEvent.type(limitField(dialog), "300000");
    // Another tab added a budget for Hiburan after this page loaded.
    rows = [
      ...rows,
      {
        id: "00000000-0000-4000-8000-000000000099",
        categoryId: HIBURAN,
        amount: 1,
      },
    ];

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );

    expect(
      await within(dialog).findByText("Kategori ini sudah punya budget"),
    ).toBeInTheDocument();
    expect(select).toHaveFocus();
    expect(select).toHaveAttribute("aria-invalid", "true");
    // The page has loaded the new budget, and the choice is still shown.
    expect(
      await screen.findByRole("button", { name: "Atur budget Hiburan" }),
    ).toBeInTheDocument();
    expect(select).toHaveValue(HIBURAN);
  });

  it("says so when every expense category has a budget", async () => {
    rows = [
      ...rows,
      {
        id: "00000000-0000-4000-8000-000000000003",
        categoryId: HIBURAN,
        amount: 300_000,
      },
    ];
    setup();
    const dialog = await openCreate();

    expect(
      await within(dialog).findByText(
        "Semua kategori pengeluaran sudah punya budget.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Simpan budget" }),
    ).not.toBeInTheDocument();
  });

  it("offers to try again when the categories fail to load", async () => {
    const answer = fetchApi.getMockImplementation();
    fetchApi.mockImplementation((path, init) => {
      if (path === "/api/categories") {
        return Promise.reject(
          new ApiError({ status: 500, code: "unknown", message: "x" }),
        );
      }
      return answer ? answer(path, init) : Promise.reject(new Error("none"));
    });
    setup();
    const dialog = await openCreate();

    expect(
      await within(dialog).findByText(
        "Formulir budget gagal dimuat. Periksa koneksi lalu coba lagi.",
      ),
    ).toBeInTheDocument();

    if (answer) fetchApi.mockImplementation(answer);
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Coba lagi" }),
    );
    expect(
      await within(dialog).findByRole("combobox", { name: "Kategori" }),
    ).toBeInTheDocument();
  });

  it("closes with Batal without saving", async () => {
    setup();
    const dialog = await openCreate();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Batal" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(headerButton()).toHaveFocus();
    expect(writes("POST")).toHaveLength(0);
  });

  it("opens from the empty page as well", async () => {
    rows = [];
    setup({ header: false });
    await userEvent.click(
      await screen.findByRole("button", { name: "Buat budget" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Buat budget" }),
    ).toBeInTheDocument();
  });
});

describe("Atur budget", () => {
  it("changes the limit of a card", async () => {
    setup();
    const dialog = await openEdit("Makan");

    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("Kategori");
    expect(limitField(dialog)).toHaveValue("1.250.000");
    expect(
      within(dialog).getByRole("meter", { name: "Makan" }),
    ).toHaveAttribute("aria-valuetext", "84% · hampir habis");

    await userEvent.clear(limitField(dialog));
    await userEvent.type(limitField(dialog), "1000000");
    expect(
      within(dialog).getByRole("meter", { name: "Makan" }),
    ).toHaveAttribute("aria-valuetext", "106% · lewat batas");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Simpan budget" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      writes("PATCH").map(([path, init]) => [path, init?.body]),
    ).toStrictEqual([
      [
        "/api/budgets/00000000-0000-4000-8000-000000000001",
        JSON.stringify({ amount: 1_000_000 }),
      ],
    ]);
    expect(await screen.findByText("Budget disimpan")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("meter", { name: "Makan" })).toHaveAttribute(
        "aria-valuetext",
        "106% · lewat batas",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Atur budget Makan" }),
    ).toHaveFocus();
  });

  it("deletes after confirming, and Urungkan brings it back", async () => {
    setup();
    const form = await openEdit("Makan");
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );

    const confirm = await screen.findByRole("dialog", {
      name: "Hapus budget ini?",
    });
    expect(
      screen.queryByRole("dialog", { name: "Atur budget" }),
    ).not.toBeInTheDocument();
    expect(confirm).toHaveTextContent(
      "Transaksi Makan tidak ikut terhapus, hanya batas dan peringatannya.",
    );
    expect(within(confirm).getByText("1.250.000 rupiah")).toBeInTheDocument();

    await userEvent.click(
      within(confirm).getByRole("button", { name: "Hapus" }),
    );

    expect(await screen.findByText("Budget dihapus")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Atur budget Makan" }),
      ).not.toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Urungkan" }));

    expect(await screen.findByText("Budget dikembalikan")).toBeInTheDocument();
    expect(writes("POST")[0]?.[1]?.body).toBe(
      JSON.stringify({ categoryId: MAKAN, amount: 1_250_000 }),
    );
    expect(
      await screen.findByRole("button", { name: "Atur budget Makan" }),
    ).toBeInTheDocument();
  });

  it("keeps the confirmation busy until the server answers", async () => {
    setup();
    const form = await openEdit("Makan");
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );
    const confirm = await screen.findByRole("dialog", {
      name: "Hapus budget ini?",
    });
    const request = holdNext("DELETE");
    await userEvent.click(
      within(confirm).getByRole("button", { name: "Hapus" }),
    );

    const remove = within(confirm).getByRole("button", { name: "Hapus" });
    expect(remove).toBeDisabled();
    expect(remove).toHaveAttribute("aria-busy", "true");

    request.release();
    expect(await screen.findByText("Budget dihapus")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the confirmation and offers a retry when deleting fails", async () => {
    setup();
    const form = await openEdit("Makan");
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );
    const confirm = await screen.findByRole("dialog", {
      name: "Hapus budget ini?",
    });
    const request = holdNext("DELETE");
    await userEvent.click(
      within(confirm).getByRole("button", { name: "Hapus" }),
    );
    request.fail(new TypeError("Failed to fetch"));

    expect(
      await screen.findByText(
        "Budget gagal dihapus. Periksa koneksi lalu coba lagi.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Atur budget Makan" }),
    ).toBeInTheDocument();
  });

  it("keeps the budget when the confirmation is cancelled", async () => {
    setup();
    const form = await openEdit("Makan");
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );
    const confirm = await screen.findByRole("dialog", {
      name: "Hapus budget ini?",
    });
    await userEvent.click(
      within(confirm).getByRole("button", { name: "Batal" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(writes("DELETE")).toHaveLength(0);
  });
});

// With cacheComponents, Next hides a page it leaves (<Activity>) and keeps
// its state; a dialog left open must not be open again on coming back.
describe("Budget page hidden and shown again", () => {
  function hiddenPage(mode: "visible" | "hidden") {
    return <Activity mode={mode}>{page()}</Activity>;
  }

  it("closes the form", async () => {
    const { rerender } = renderWithProviders(hiddenPage("visible"));
    await openEdit("Makan");

    rerender(hiddenPage("hidden"));
    rerender(hiddenPage("visible"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the delete confirmation", async () => {
    const { rerender } = renderWithProviders(hiddenPage("visible"));
    const form = await openEdit("Makan");
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );
    await screen.findByRole("dialog", { name: "Hapus budget ini?" });

    rerender(hiddenPage("hidden"));
    rerender(hiddenPage("visible"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("budget dialogs and axe", () => {
  it("has no violations in the open forms and the confirmation", async () => {
    const { container } = setup();
    const create = await openCreate();
    await within(create).findByRole("combobox", { name: "Kategori" });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      within(create).getByRole("button", { name: "Batal" }),
    );

    const form = await openEdit("Makan");
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      within(form).getByRole("button", { name: "Hapus budget" }),
    );
    await screen.findByRole("dialog", { name: "Hapus budget ini?" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
