"use client";

import { useSearchParams } from "next/navigation";
import type { SocialProviderId } from "@/lib/auth-providers";
import { safeNext } from "../safe-next";
import { SignInOptions } from "./sign-in-options";

/** SignInOptions with `?next=` and `?error=` from the URL. */
export function SignInOptionsFromUrl({
  providers,
}: {
  providers: readonly SocialProviderId[];
}) {
  const params = useSearchParams();
  return (
    <SignInOptions
      providers={providers}
      next={safeNext(params.get("next"))}
      error={params.get("error") ?? undefined}
    />
  );
}
