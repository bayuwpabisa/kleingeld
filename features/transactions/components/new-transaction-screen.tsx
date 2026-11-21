"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useResetOnHide } from "@/lib/use-reset-on-hide";

import { useCreateTransaction } from "../api/use-create-transaction";
import { TransactionFormLoader } from "./transaction-form-loader";

/**
 * /transactions/new, the add form as a full page (phones, from the bottom
 * nav). Saving goes straight back to the list, where the new row already
 * shows (optimistic); the toast confirms or reports a failure.
 *
 * Next keeps this page's state while it is hidden (cacheComponents). A draft
 * the user leaves without saving stays; once saved, the form starts empty
 * the next time, or the same values could be saved twice. It is cleared as
 * the page is hidden, so it does not empty itself while the list loads.
 */
export function NewTransactionScreen() {
  const router = useRouter();
  const create = useCreateTransaction();
  const [formKey, setFormKey] = useState(0);
  const saved = useRef(false);
  useResetOnHide(() => {
    if (!saved.current) return;
    saved.current = false;
    setFormKey((key) => key + 1);
  });

  return (
    <TransactionFormLoader
      key={formKey}
      onSubmit={(values) => {
        create.mutate(values);
        saved.current = true;
        router.push("/transactions");
      }}
    />
  );
}
