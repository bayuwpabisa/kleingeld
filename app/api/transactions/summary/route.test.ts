/**
 * @jest-environment node
 */
import { summarizeTransactions } from "@/features/transactions/server/transactions-repo";
import { getCurrentUser } from "@/lib/session";

import { GET } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/transactions/server/transactions-repo", () => ({
  summarizeTransactions: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const summarize = jest.mocked(summarizeTransactions);

const summary = {
  income: { total: 8_500_000, count: 1 },
  expense: { total: 50_000, count: 2 },
  balance: 8_450_000,
};

beforeEach(() => {
  jest.clearAllMocks();
  currentUser.mockResolvedValue({
    id: "alice",
    name: "Alice",
    email: "alice@example.test",
    isDemo: false,
  });
});

describe("GET /api/transactions/summary", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await GET(
      new Request("http://localhost/api/transactions/summary"),
    );
    expect(response.status).toBe(401);
    expect(summarize).not.toHaveBeenCalled();
  });

  it("summarizes the user's transactions that match the filters", async () => {
    summarize.mockResolvedValue(summary);

    const response = await GET(
      new Request(
        "http://localhost/api/transactions/summary?q=kopi&from=2026-11-01&to=2026-11-30&page=2&sort=amount",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(summary);
    // Page and sort do not change a summary, so they are not passed on.
    expect(summarize).toHaveBeenCalledWith({ name: "app-db" }, "alice", {
      q: "kopi",
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("answers 400 for a range that ends before it starts", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/transactions/summary?from=2026-11-30&to=2026-11-01",
      ),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.to).toHaveLength(1);
    expect(summarize).not.toHaveBeenCalled();
  });
});
