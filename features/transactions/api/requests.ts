import { apiFetch } from "@/lib/api/client";
import type {
  TransactionDto,
  TransactionInput,
  TransactionUpdate,
} from "@/schemas/transaction";

// The write calls of the transactions API, used by the mutation hooks.

export function createTransaction(input: TransactionInput) {
  return apiFetch<TransactionDto>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTransaction(id: string, values: TransactionUpdate) {
  return apiFetch<TransactionDto>(`/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteTransaction(id: string) {
  return apiFetch<void>(`/api/transactions/${id}`, { method: "DELETE" });
}

export function fetchTransaction(id: string, signal?: AbortSignal) {
  return apiFetch<TransactionDto>(`/api/transactions/${id}`, { signal });
}
