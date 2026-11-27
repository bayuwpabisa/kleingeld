/**
 * @jest-environment node
 */
import {
  deleteBudget,
  updateBudget,
} from "@/features/budgets/server/budgets-repo";
import { getCurrentUser } from "@/lib/session";
import type { BudgetDto } from "@/schemas/budget";

import { DELETE, PATCH } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/budgets/server/budgets-repo", () => ({
  updateBudget: jest.fn(),
  deleteBudget: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const update = jest.mocked(updateBudget);
const remove = jest.mocked(deleteBudget);

const ID = "0b6e5f00-0000-4000-8000-000000000001";
const URL_ = `http://localhost/api/budgets/${ID}`;
const dto: BudgetDto = {
  id: ID,
  category: {
    id: "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f",
    name: "Makan",
    icon: "utensils",
  },
  amount: 1_500_000,
};

const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function patchRequest(body: unknown, contentType = "application/json") {
  return new Request(URL_, {
    method: "PATCH",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

const deleteRequest = () => new Request(URL_, { method: "DELETE" });

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
    ["PATCH", () => PATCH(patchRequest({ amount: 1 }), ctx())],
    ["DELETE", () => DELETE(deleteRequest(), ctx())],
  ])("%s answers 401", async (_method, call) => {
    const response = await call();
    expect(response.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("an id that is not a uuid", () => {
  it.each([
    ["PATCH", () => PATCH(patchRequest({ amount: 1 }), ctx("123"))],
    ["DELETE", () => DELETE(deleteRequest(), ctx("123"))],
  ])("%s answers 404 without a query", async (_method, call) => {
    const response = await call();
    expect(response.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/budgets/[id]", () => {
  it("changes the limit", async () => {
    update.mockResolvedValue({ ok: true, data: { ...dto, amount: 2_000_000 } });

    const response = await PATCH(patchRequest({ amount: 2_000_000 }), ctx());

    expect(response.status).toBe(200);
    expect((await response.json()).amount).toBe(2_000_000);
    expect(update).toHaveBeenCalledWith({ name: "app-db" }, "alice", ID, {
      amount: 2_000_000,
    });
  });

  it("answers 404 when the user has no such budget", async () => {
    update.mockResolvedValue({ ok: false, reason: "not_found" });
    const response = await PATCH(patchRequest({ amount: 1 }), ctx());
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("not_found");
  });

  it("answers 400 without a limit", async () => {
    const response = await PATCH(patchRequest({}), ctx());
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors).toEqual({
      amount: ["Isi nominal"],
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a new category", async () => {
    const response = await PATCH(
      patchRequest({ amount: 1, categoryId: dto.category.id }),
      ctx(),
    );
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
});

describe("DELETE /api/budgets/[id]", () => {
  it("answers 204 with an empty body", async () => {
    remove.mockResolvedValue(true);
    const response = await DELETE(deleteRequest(), ctx());
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(remove).toHaveBeenCalledWith({ name: "app-db" }, "alice", ID);
  });

  it("answers 404 when the user has no such budget", async () => {
    remove.mockResolvedValue(false);
    const response = await DELETE(deleteRequest(), ctx());
    expect(response.status).toBe(404);
  });
});
