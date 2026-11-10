/**
 * The page to open after sign-in, from `?next=`. Only paths inside this app
 * pass, so the link cannot send someone to another site (open redirect).
 */
export function safeNext(value: string | null | undefined) {
  if (!value?.startsWith("/")) return undefined;
  // "//host" and "/\host" are read by browsers as another origin.
  if (value.startsWith("//") || value.startsWith("/\\")) return undefined;
  return value;
}
