import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/auth-providers";

/** The login page's subtitle, naming only the providers that have keys. */
export function signInIntro(providers: readonly SocialProviderId[]): string {
  const labels = SOCIAL_PROVIDERS.filter(({ id }) =>
    providers.includes(id),
  ).map(({ label }) => label);
  if (labels.length === 0) {
    return "Coba Kleingeld dengan akun demo. Tidak perlu membuat akun.";
  }
  return `Pakai akun ${labels.join(" atau ")}. Tidak perlu membuat password.`;
}
