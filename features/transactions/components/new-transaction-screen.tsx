"use client";

import { useRouter } from "next/navigation";

import { useCreateTransaction } from "../api/use-create-transaction";
import { TransactionFormLoader } from "./transaction-form-loader";

/**
 * /transactions/new, the add form as a full page (phones, from the bottom
 * nav). Saving goes straight back to the list, where the new row already
 * shows (optimistic); the toast confirms or reports a failure.
 */
export function NewTransactionScreen() {
  const router = useRouter();
  const create = useCreateTransaction();

  return (
    <TransactionFormLoader
      onSubmit={(values) => {
        create.mutate(values);
        router.push("/transactions");
      }}
    />
  );
}
