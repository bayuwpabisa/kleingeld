"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/auth-providers";
import { useResetOnHide } from "@/lib/use-reset-on-hide";
import { DemoSignInButton } from "./demo-sign-in-button";

type SignInOptionsProps = {
  /** Providers the server accepts (`socialProviderIds`); others get no button. */
  providers: readonly SocialProviderId[];
  /** Where to go once signed in (already checked with `safeNext`). */
  next?: string;
  /** Set when an OAuth sign-in came back with `?error=`. */
  error?: string;
};

/**
 * The ways in, as on the login wireframe: Google, GitHub, demo. A provider
 * without keys gets no button, so only the demo may be left.
 */
export function SignInOptions({
  providers,
  next = "/dashboard",
  error,
}: SignInOptionsProps) {
  const toast = useToast();
  const [pending, setPending] = useState<SocialProviderId | null>(null);
  // Pending lasts until the browser leaves; this page may be shown again.
  useResetOnHide(() => setPending(null));
  const offered = SOCIAL_PROVIDERS.filter(({ id }) => providers.includes(id));

  async function signInWith(provider: SocialProviderId, label: string) {
    setPending(provider);
    const result = await authClient.signIn.social({
      provider,
      callbackURL: next,
      errorCallbackURL: "/login",
    });
    // On success the browser is already leaving for the provider.
    if (result.error) {
      setPending(null);
      toast.show({
        message: `Gagal masuk dengan ${label}. Coba lagi atau pakai akun demo.`,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          Gagal masuk. Coba lagi, atau pakai akun demo.
        </p>
      )}
      {offered.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {offered.map(({ id, label }) => (
              <Button
                key={id}
                variant="secondary"
                busy={pending === id}
                disabled={pending !== null && pending !== id}
                onClick={() => signInWith(id, label)}
              >
                Lanjut dengan {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-fg-muted">
            <span aria-hidden className="h-px flex-1 bg-border" />
            atau
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <DemoSignInButton next={next} />
      <p className="text-center text-xs text-fg-muted lg:text-left">
        Akun demo berisi data contoh. Data di-reset setiap login demo dan setiap
        hari.
      </p>
    </div>
  );
}
