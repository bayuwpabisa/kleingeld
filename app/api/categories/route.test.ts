/**
 * @jest-environment node
 */
import { listCategories } from "@/features/categories/server/categories-repo";
import { getCurrentUser } from "@/lib/session";

import { GET } from "./route";

jest.mock("@/db", () => ({ db: { name: "app-db" } }));
jest.mock("@/lib/session", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/features/categories/server/categories-repo", () => ({
  listCategories: jest.fn(),
}));

const currentUser = jest.mocked(getCurrentUser);
const list = jest.mocked(listCategories);

beforeEach(() => jest.clearAllMocks());

describe("GET /api/categories", () => {
  it("answers 401 without a session", async () => {
    currentUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });

  it("lists the signed-in user's categories", async () => {
    currentUser.mockResolvedValue({
      id: "alice",
      name: "Alice",
      email: "alice@example.test",
      isDemo: false,
    });
    const categories = [
      { id: "c1", name: "Makan", type: "expense" as const, icon: "utensils" },
    ];
    list.mockResolvedValue(categories);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(categories);
    expect(list).toHaveBeenCalledWith({ name: "app-db" }, "alice");
  });
});
