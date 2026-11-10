"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

type DemoSignInButtonProps = {
  /** Where to go once signed in. */
  next?: string;
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
};

/**
 * Signs in to the shared demo account. The server resets its data first,
 * which takes a moment, so the button says so while it waits.
 */
export function DemoSignInButton({
  next = "/dashboard",
  variant = "primary",
  className,
  children = "Masuk dengan akun demo",
}: DemoSignInButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await authClient.signIn.demo();
    if (error) {
      setBusy(false);
      toast.show({ message: "Gagal masuk ke akun demo. Coba lagi." });
      return;
    }
    // Stays busy until the next page replaces this one.
    router.replace(next);
  }

  return (
    <Button
      variant={variant}
      busy={busy}
      onClick={signIn}
      className={className}
    >
      {busy ? "Menyiapkan data demo…" : children}
    </Button>
  );
}
