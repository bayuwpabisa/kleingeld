/**
 * @jest-environment node
 */
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import nextConfig from "./next.config";
import { config, proxy } from "./proxy";

// better-auth ships ESM only, which Jest cannot load here. This stand-in
// finds the cookie the same way: by its name, with or without __Secure-.
jest.mock("better-auth/cookies", () => ({
  getSessionCookie: (request: Request) =>
    /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/.exec(
      request.headers.get("cookie") ?? "",
    )?.[1] ?? null,
}));

const matches = (url: string) =>
  // Named "proxy" in the docs, but this Next version still exports the
  // middleware name.
  unstable_doesMiddlewareMatch({ config, nextConfig, url });

describe("proxy matcher", () => {
  it.each([
    "/dashboard",
    "/transactions",
    "/transactions/new",
    "/budgets",
    "/bills",
    "/settings",
  ])("guards %s", (url) => {
    expect(matches(url)).toBe(true);
  });

  it.each(["/", "/login", "/api/auth/get-session", "/dashboards"])(
    "leaves %s alone",
    (url) => {
      expect(matches(url)).toBe(false);
    },
  );
});

describe("proxy", () => {
  it("sends a visitor without a session to the login page", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/transactions?type=expense"),
    );
    expect(getRedirectUrl(response)).toBe(
      "http://localhost:3000/login?next=%2Ftransactions%3Ftype%3Dexpense",
    );
  });

  it("lets a request with a session cookie through", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/budgets", {
        headers: { cookie: "better-auth.session_token=token.signature" },
      }),
    );
    expect(getRedirectUrl(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
