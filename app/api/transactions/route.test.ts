/**
 * @jest-environment node
 */
import {
  createTransaction,
  listTransactions,
} from "@/features/transactions/server/transactions-repo";
import { getCurrentUser } from "@/lib/session";
import type { TransactionDto } from "@/schemas/transaction";

import { GET, POST } from "./route";

// The handlers are tested with the session and the data access mocked.
// The data access itself runs against real SQL in transactions-repo.test.ts.
jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/transactions/server/transactions-repo", () => ({
  listTransactions: jest.fn(),
  createTransaction: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const list = jest.mocked(listTransactions);
const create = jest.mocked(createTransaction);

const CATEGORY_ID = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const dto: TransactionDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  type: "expense",
  amount: 25_000,
  date: "2026-11-11",
  note: null,
  category: { id: CATEGORY_ID, name: "Makan", icon: "utensils" },
  createdAt: "2026-11-11T05:00:00.000Z",
  updatedAt: "2026-11-11T05:00:00.000Z",
};
const input = {
  type: "expense",
  categoryId: CATEGORY_ID,
  amount: 25_000,
  date: "2026-11-11",
};

function postRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/transactions", {
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

describe("GET /api/transactions", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await GET(
      new Request("http://localhost/api/transactions"),
    );
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("unauthorized");
    expect(list).not.toHaveBeenCalled();
  });

  it("lists the signed-in user's transactions with default paging", async () => {
    const page = { data: [dto], page: 1, pageSize: 20, total: 1 };
    list.mockResolvedValue(page);

    const response = await GET(
      new Request("http://localhost/api/transactions"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(page);
    expect(list).toHaveBeenCalledWith({ name: "app-db" }, "alice", {
      page: 1,
      pageSize: 20,
    });
  });

  it("reads page and pageSize from the query string", async () => {
    list.mockResolvedValue({ data: [], page: 3, pageSize: 50, total: 0 });
    await GET(
      new Request("http://localhost/api/transactions?page=3&pageSize=50"),
    );
    expect(list).toHaveBeenCalledWith(expect.anything(), "alice", {
      page: 3,
      pageSize: 50,
    });
  });

  it("answers 400 for a bad page size", async () => {
    const response = await GET(
      new Request("http://localhost/api/transactions?pageSize=1000"),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.pageSize).toHaveLength(1);
    expect(list).not.toHaveBeenCalled();
  });
});

describe("POST /api/transactions", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await POST(postRequest(input));
    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the transaction for the session's user and answers 201", async () => {
    create.mockResolvedValue({ ok: true, data: dto });

    const response = await POST(postRequest(input));

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(
      `/api/transactions/${dto.id}`,
    );
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
      postRequest({ ...input, amount: -5, date: "kemarin" }),
    );
    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(Object.keys(error.fieldErrors).sort()).toEqual(["amount", "date"]);
  });

  it("answers 415 for a body that is not JSON", async () => {
    const response = await POST(postRequest(input, "text/plain"));
    expect(response.status).toBe(415);
  });

  it.each([
    ["category_not_found", "Kategori tidak ditemukan"],
    ["category_type_mismatch", "Kategori tidak cocok dengan tipe transaksi"],
  ] as const)("reports %s on the category field", async (reason, message) => {
    create.mockResolvedValue({ ok: false, reason });

    const response = await POST(postRequest(input));

    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toEqual({
      categoryId: [message],
    });
  });
});
