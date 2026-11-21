/**
 * The OAuth providers Kleingeld can offer and which of them have keys.
 * Shared by the Better Auth config (`lib/auth.ts`) and the login page, so a
 * sign-in button is shown exactly when the server accepts that provider.
 * No database import: pages can use it.
 */
export const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDERS)[number]["id"];

type ProviderKeys = { clientId: string; clientSecret: string };

type Env = Readonly<Record<string, string | undefined>>;

const envNames: Record<SocialProviderId, { id: string; secret: string }> = {
  google: { id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" },
  github: { id: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET" },
};

/**
 * Better Auth's `socialProviders`: a provider is only offered when both its
 * keys are set. Vercel previews have no OAuth app (their URLs change), so
 * there only the demo sign-in works.
 */
export function socialProvidersConfig(
  env: Env,
): Partial<Record<SocialProviderId, ProviderKeys>> {
  const config: Partial<Record<SocialProviderId, ProviderKeys>> = {};
  for (const { id } of SOCIAL_PROVIDERS) {
    const clientId = env[envNames[id].id];
    const clientSecret = env[envNames[id].secret];
    if (clientId && clientSecret) config[id] = { clientId, clientSecret };
  }
  return config;
}

/** The configured providers' ids, Google first. No keys, only ids. */
export function socialProviderIds(env: Env): SocialProviderId[] {
  const config = socialProvidersConfig(env);
  return SOCIAL_PROVIDERS.map(({ id }) => id).filter((id) => id in config);
}
