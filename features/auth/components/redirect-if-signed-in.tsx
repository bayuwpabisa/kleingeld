import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/** On /login: someone already signed in goes straight to the dashboard. */
export async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/dashboard");
  return null;
}
