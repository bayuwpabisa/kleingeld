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

/** The signed-in user, narrowed to what the UI needs; else go to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id, name, email } = session.user;
  return { id, name, email, isDemo: id === DEMO_USER.id };
}
