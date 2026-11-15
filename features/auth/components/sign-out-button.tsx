"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

type SignOutButtonProps = {
  /** "nav" looks like a sidebar item; "button" is a full secondary button. */
  appearance?: "button" | "nav";
};

/** "Keluar": ends the session and returns to the landing page. */
export function SignOutButton({ appearance = "button" }: SignOutButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const { error } = await authClient.signOut();
    if (error) {
      setBusy(false);
      toast.show({ message: "Gagal keluar. Coba lagi." });
      return;
    }
    router.replace("/");
    // Drops the signed-in pages from the client router cache.
    router.refresh();
  }

  if (appearance === "nav") {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        aria-busy={busy || undefined}
        className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
        Keluar
      </button>
    );
  }

  return (
    <Button variant="secondary" busy={busy} onClick={signOut}>
      Keluar
    </Button>
  );
}
