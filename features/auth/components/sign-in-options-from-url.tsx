"use client";

import { useSearchParams } from "next/navigation";
import { safeNext } from "../safe-next";
import { SignInOptions } from "./sign-in-options";

/** SignInOptions with `?next=` and `?error=` from the URL. */
export function SignInOptionsFromUrl() {
  const params = useSearchParams();
  return (
    <SignInOptions
      next={safeNext(params.get("next"))}
      error={params.get("error") ?? undefined}
    />
  );
}
