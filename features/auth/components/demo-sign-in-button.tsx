"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { useResetOnHide } from "@/lib/use-reset-on-hide";

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
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  // Busy lasts until the next page; this page may be shown again later.
  useResetOnHide(() => setBusy(false));

  async function signIn() {
    setBusy(true);
    const { error } = await authClient.signIn.demo();
    if (error) {
      setBusy(false);
      toast.show({ message: "Gagal masuk ke akun demo. Coba lagi." });
      return;
    }
    // A session that ended without "Keluar" may have left another user's
    // data in the cache; the demo starts clean.
    queryClient.clear();
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
