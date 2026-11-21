import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps signed-out visitors out of the app pages. This only checks that a
 * session cookie exists (fast, no database); the real check happens on the
 * server in lib/session.ts. /login is not redirected here, so an expired
 * cookie cannot cause a redirect loop.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/bills/:path*",
    "/settings/:path*",
  ],
};
