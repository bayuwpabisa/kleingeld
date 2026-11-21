/**
 * @jest-environment node
 */
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { getCurrentUser, requireUser } from "./session";

// Better Auth is ESM only and cannot load in Jest, so it is mocked here.
jest.mock("./auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("next/headers", () => ({
  headers: jest.fn(async () => new Headers()),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const getSession = auth.api.getSession as unknown as jest.Mock;

function signedInAs(id: string) {
  getSession.mockResolvedValue({
    session: { id: "s1" },
    user: { id, name: "Ayu", email: "ayu@example.test", image: null },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getCurrentUser", () => {
  it("returns null when nobody is signed in", async () => {
    getSession.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns only the fields the app needs", async () => {
    signedInAs("user-1");
    expect(await getCurrentUser()).toEqual({
      id: "user-1",
      name: "Ayu",
      email: "ayu@example.test",
      isDemo: false,
    });
  });

  it("marks the demo account", async () => {
    signedInAs("demo");
    expect((await getCurrentUser())?.isDemo).toBe(true);
  });
});

describe("requireUser", () => {
  it("sends a signed-out visitor to /login", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the signed-in user", async () => {
    signedInAs("user-1");
    expect((await requireUser()).id).toBe("user-1");
    expect(redirect).not.toHaveBeenCalled();
  });
});
