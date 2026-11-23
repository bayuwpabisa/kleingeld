/**
 * @jest-environment node
 */
import { monthlyTotals } from "@/features/transactions/server/transactions-repo";
import { getCurrentUser } from "@/lib/session";

import { GET } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/transactions/server/transactions-repo", () => ({
  monthlyTotals: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const totals = jest.mocked(monthlyTotals);

const months = [
  { month: "2026-10", income: 8_500_000, expense: 6_200_000 },
  { month: "2026-11", income: 0, expense: 6_305_000 },
];

function get(query: string) {
  return GET(new Request(`http://localhost/api/transactions/trend${query}`));
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

describe("GET /api/transactions/trend", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await get("?from=2026-10&to=2026-11");
    expect(response.status).toBe(401);
    expect(totals).not.toHaveBeenCalled();
  });

  it("returns the user's totals per month for the range", async () => {
    totals.mockResolvedValue(months);

    const response = await get("?from=2026-10&to=2026-11&type=income");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(months);
    // Only the range is passed on; other parameters are dropped.
    expect(totals).toHaveBeenCalledWith({ name: "app-db" }, "alice", {
      from: "2026-10",
      to: "2026-11",
    });
  });

  it("answers 400 without a range", async () => {
    const response = await get("");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("validation_error");
    expect(Object.keys(body.error.fieldErrors).sort()).toEqual(["from", "to"]);
    expect(totals).not.toHaveBeenCalled();
  });

  it("answers 400 for a range that ends before it starts", async () => {
    const response = await get("?from=2026-11&to=2026-10");
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.to).toEqual([
      "Bulan awal harus sebelum bulan akhir",
    ]);
    expect(totals).not.toHaveBeenCalled();
  });

  it("answers 400 for a range that is too long", async () => {
    const response = await get("?from=2024-11&to=2026-11");
    expect(response.status).toBe(400);
    expect(totals).not.toHaveBeenCalled();
  });
});
