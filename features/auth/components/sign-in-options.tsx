"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { DemoSignInButton } from "./demo-sign-in-button";

const providers = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
] as const;

type Provider = (typeof providers)[number]["id"];

type SignInOptionsProps = {
  /** Where to go once signed in (already checked with `safeNext`). */
  next?: string;
  /** Set when an OAuth sign-in came back with `?error=`. */
  error?: string;
};

/** The three ways in, as on the login wireframe: Google, GitHub, demo. */
export function SignInOptions({
  next = "/dashboard",
  error,
}: SignInOptionsProps) {
  const toast = useToast();
  const [pending, setPending] = useState<Provider | null>(null);

  async function signInWith(provider: Provider, label: string) {
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
      <div className="flex flex-col gap-3">
        {providers.map(({ id, label }) => (
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
      <DemoSignInButton next={next} />
      <p className="text-xs text-fg-muted">
        Akun demo berisi data contoh. Data di-reset setiap login demo dan setiap
        hari.
      </p>
    </div>
  );
}
