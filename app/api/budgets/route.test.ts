/**
 * @jest-environment node
 */
import {
  createBudget,
  listBudgetStatus,
} from "@/features/budgets/server/budgets-repo";
import { getCurrentUser } from "@/lib/session";
import type { BudgetDto, BudgetStatus } from "@/schemas/budget";

import { GET, POST } from "./route";

// The handlers are tested with the session and the data access mocked.
// The data access itself runs against real SQL in budgets-repo.test.ts.
jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/budgets/server/budgets-repo", () => ({
  listBudgetStatus: jest.fn(),
  createBudget: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const list = jest.mocked(listBudgetStatus);
const create = jest.mocked(createBudget);

const URL_ = "http://localhost/api/budgets";
const CATEGORY_ID = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const dto: BudgetDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  category: { id: CATEGORY_ID, name: "Makan", icon: "utensils" },
  amount: 1_500_000,
};
const input = { categoryId: CATEGORY_ID, amount: 1_500_000 };

function postRequest(body: unknown, contentType = "application/json") {
  return new Request(URL_, {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  currentUser.mockResolvedValue({
    id: "alice",
    name: "Alice",
    email: "alice@example.test",
    isDemo: false,
  });
});

describe("GET /api/budgets", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await GET(new Request(`${URL_}?month=2026-11`));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("unauthorized");
    expect(list).not.toHaveBeenCalled();
  });

  it("lists the user's budgets for the month", async () => {
    const rows: BudgetStatus[] = [{ ...dto, spent: 1_275_000, count: 30 }];
    list.mockResolvedValue(rows);

    const response = await GET(new Request(`${URL_}?month=2026-11`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(rows);
    expect(list).toHaveBeenCalledWith({ name: "app-db" }, "alice", "2026-11");
  });

  it.each([
    ["no month", ""],
    ["a bad month", "?month=2026-13"],
  ])("answers 400 for %s", async (_name, search) => {
    const response = await GET(new Request(`${URL_}${search}`));
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toEqual({
      month: ["Bulan tidak valid"],
    });
    expect(list).not.toHaveBeenCalled();
  });
});

describe("POST /api/budgets", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await POST(postRequest(input));
    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the budget for the session's user and answers 201", async () => {
    create.mockResolvedValue({ ok: true, data: dto });

    const response = await POST(postRequest(input));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(dto);
    expect(create).toHaveBeenCalledWith({ name: "app-db" }, "alice", input);
  });

  it("refuses a userId in the body instead of using it", async () => {
    const response = await POST(postRequest({ ...input, userId: "bob" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.formErrors).toEqual([
      "Field tidak dikenal: userId",
    ]);
    expect(create).not.toHaveBeenCalled();
  });

  it("answers 400 with field errors for invalid input", async () => {
    const response = await POST(
      postRequest({ categoryId: "makan", amount: 0 }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(Object.keys(error.fieldErrors).sort()).toEqual([
      "amount",
      "categoryId",
    ]);
    expect(create).not.toHaveBeenCalled();
  });

  it("answers 415 for a body that is not JSON", async () => {
    const response = await POST(postRequest(input, "text/plain"));
    expect(response.status).toBe(415);
  });

  it.each([
    ["category_not_found", "Kategori tidak ditemukan"],
    ["category_not_expense", "Budget hanya untuk kategori pengeluaran"],
  ] as const)("reports %s on the category field", async (reason, message) => {
    create.mockResolvedValue({ ok: false, reason });

    const response = await POST(postRequest(input));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toStrictEqual({
      code: "validation_error",
      message: "Data tidak valid",
      fieldErrors: { categoryId: [message] },
      formErrors: [],
    });
  });

  it("answers 409 when the category already has a budget", async () => {
    create.mockResolvedValue({ ok: false, reason: "duplicate" });

    const response = await POST(postRequest(input));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toStrictEqual({
      code: "conflict",
      message: "Kategori ini sudah punya budget",
      fieldErrors: { categoryId: ["Kategori ini sudah punya budget"] },
      formErrors: [],
    });
  });
});
