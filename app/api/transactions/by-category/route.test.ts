/**
 * @jest-environment node
 */
import { totalsByCategory } from "@/features/transactions/server/transactions-repo";
import { getCurrentUser } from "@/lib/session";

import { GET } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/transactions/server/transactions-repo", () => ({
  totalsByCategory: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const totals = jest.mocked(totalsByCategory);

const rows = [
  {
    category: {
      id: "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f",
      name: "Makan",
      icon: "utensils",
    },
    total: 1_275_000,
    count: 41,
  },
];

function get(query: string) {
  return GET(
    new Request(`http://localhost/api/transactions/by-category${query}`),
  );
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

describe("GET /api/transactions/by-category", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await get("?type=expense");
    expect(response.status).toBe(401);
    expect(totals).not.toHaveBeenCalled();
  });

  it("returns the user's totals per category for the type and range", async () => {
    totals.mockResolvedValue(rows);

    const response = await get(
      "?type=expense&from=2026-11-01&to=2026-11-30&q=kopi",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(rows);
    // A search does not apply here, so it is not passed on.
    expect(totals).toHaveBeenCalledWith({ name: "app-db" }, "alice", {
      type: "expense",
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it("answers 400 without a type", async () => {
    const response = await get("?from=2026-11-01&to=2026-11-30");
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.type).toEqual([
      "Tipe tidak valid",
    ]);
    expect(totals).not.toHaveBeenCalled();
  });

  it("answers 400 for a range that ends before it starts", async () => {
    const response = await get("?type=expense&from=2026-11-30&to=2026-11-01");
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.to).toHaveLength(1);
    expect(totals).not.toHaveBeenCalled();
  });
});
