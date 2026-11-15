/**
 * @jest-environment node
 */
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/features/transactions/server/transactions-repo";
import { getCurrentUser } from "@/lib/session";
import type { TransactionDto } from "@/schemas/transaction";

import { DELETE, GET, PATCH } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/transactions/server/transactions-repo", () => ({
  getTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const get = jest.mocked(getTransaction);
const update = jest.mocked(updateTransaction);
const remove = jest.mocked(deleteTransaction);

const ID = "0b6e5f00-0000-4000-8000-000000000001";
const URL_ = `http://localhost/api/transactions/${ID}`;
const dto: TransactionDto = {
  id: ID,
  type: "expense",
  amount: 25_000,
  date: "2026-11-11",
  note: null,
  category: {
    id: "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f",
    name: "Makan",
    icon: "utensils",
  },
  createdAt: "2026-11-11T05:00:00.000Z",
  updatedAt: "2026-11-11T05:00:00.000Z",
};

const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function patchRequest(body: unknown, contentType = "application/json") {
  return new Request(URL_, {
    method: "PATCH",
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

describe("without a session", () => {
  beforeEach(() => currentUser.mockResolvedValue(null));

  it.each([
    ["GET", () => GET(new Request(URL_), ctx())],
    ["PATCH", () => PATCH(patchRequest({ amount: 1 }), ctx())],
    ["DELETE", () => DELETE(new Request(URL_, { method: "DELETE" }), ctx())],
  ])("%s answers 401", async (_method, call) => {
    const response = await call();
    expect(response.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("an id that is not a uuid", () => {
  it.each([
    ["GET", () => GET(new Request(URL_), ctx("123"))],
    ["PATCH", () => PATCH(patchRequest({ amount: 1 }), ctx("123"))],
    [
      "DELETE",
      () => DELETE(new Request(URL_, { method: "DELETE" }), ctx("123")),
    ],
  ])("%s answers 404 without a query", async (_method, call) => {
    const response = await call();
    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("GET /api/transactions/[id]", () => {
  it("returns the user's transaction", async () => {
    get.mockResolvedValue(dto);
    const response = await GET(new Request(URL_), ctx());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dto);
    expect(get).toHaveBeenCalledWith({ name: "app-db" }, "alice", ID);
  });

  it("answers 404 when the user has no such transaction", async () => {
    get.mockResolvedValue(null);
    const response = await GET(new Request(URL_), ctx());
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("not_found");
  });
});

describe("PATCH /api/transactions/[id]", () => {
  it("updates the given fields", async () => {
    update.mockResolvedValue({ ok: true, data: { ...dto, amount: 30_000 } });

    const response = await PATCH(patchRequest({ amount: 30_000 }), ctx());

    expect(response.status).toBe(200);
    expect((await response.json()).amount).toBe(30_000);
    expect(update).toHaveBeenCalledWith({ name: "app-db" }, "alice", ID, {
      amount: 30_000,
    });
  });

  it("answers 404 when the user has no such transaction", async () => {
    update.mockResolvedValue({ ok: false, reason: "not_found" });
    const response = await PATCH(patchRequest({ amount: 1 }), ctx());
    expect(response.status).toBe(404);
  });

  it("answers 400 for an empty update", async () => {
    const response = await PATCH(patchRequest({}), ctx());
    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("answers 415 for a body that is not JSON", async () => {
    const response = await PATCH(
      patchRequest({ amount: 1 }, "text/plain"),
      ctx(),
    );
    expect(response.status).toBe(415);
  });

  it("reports a category problem on the category field", async () => {
    update.mockResolvedValue({ ok: false, reason: "category_type_mismatch" });
    const response = await PATCH(patchRequest({ type: "income" }), ctx());
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toEqual({
      categoryId: ["Kategori tidak cocok dengan tipe transaksi"],
    });
  });
});

describe("DELETE /api/transactions/[id]", () => {
  it("answers 204 with an empty body", async () => {
    remove.mockResolvedValue(true);
    const response = await DELETE(
      new Request(URL_, { method: "DELETE" }),
      ctx(),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(remove).toHaveBeenCalledWith({ name: "app-db" }, "alice", ID);
  });

  it("answers 404 when the user has no such transaction", async () => {
    remove.mockResolvedValue(false);
    const response = await DELETE(
      new Request(URL_, { method: "DELETE" }),
      ctx(),
    );
    expect(response.status).toBe(404);
  });
});
