"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/store/hooks";
import { editorOpened } from "@/lib/store/transaction-editor-slice";

/**
 * "Tambah transaksi" in the page header, desktop only: it opens the form
 * dialog (app/(app)/layout.tsx) over the current page. Phones use the add
 * button in the bottom nav, which goes to /transactions/new. The wrapper
 * hides it, because the button's own `inline-flex` would clash with
 * `hidden` (no tailwind-merge, see lib/cn.ts).
 */
export function AddTransactionButton() {
  const dispatch = useAppDispatch();
  return (
    <div className="hidden lg:flex">
      <Button onClick={() => dispatch(editorOpened({ mode: "create" }))}>
        <Plus aria-hidden className="size-5" strokeWidth={1.75} />
        Tambah transaksi
      </Button>
    </div>
  );
}
