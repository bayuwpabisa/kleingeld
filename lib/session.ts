import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_USER } from "@/db/demo/demo-user";
import { auth } from "./auth";

// The one place that reads the session on the server (Data Access Layer).
// proxy.ts only checks that a cookie exists; these check that it is valid.
// Both read the request, so call them inside a <Suspense> boundary.

/** The current session, or null. Read once per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
};

/** The signed-in user, narrowed to what the app needs, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email, isDemo: id === DEMO_USER.id };
}

/**
 * For pages: the signed-in user, else go to /login. Route Handlers use
 * getCurrentUser() and answer 401 instead, because an API call cannot follow
 * a redirect to a sign-in page.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
