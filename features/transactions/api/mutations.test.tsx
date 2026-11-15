import { act, waitFor } from "@testing-library/react";

import { categoryKeys } from "@/features/categories/api/use-categories";
import { ApiError, apiFetch } from "@/lib/api/client";
import { runToastAction } from "@/lib/store/toast-slice";
import type { CategoryDto } from "@/schemas/category";
import type {
  TransactionDto,
  TransactionInput,
  TransactionPage,
} from "@/schemas/transaction";
import { renderHookWithProviders } from "@/test/render-with-providers";

import { transactionKeys } from "./keys";
import { useCreateTransaction } from "./use-create-transaction";
import { useDeleteTransaction } from "./use-delete-transaction";
import { useUpdateTransaction } from "./use-update-transaction";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const categories: CategoryDto[] = [
  { id: MAKAN, name: "Makan", type: "expense", icon: "utensils" },
];

const existing: TransactionDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  type: "expense",
  amount: 35_000,
  date: "2026-11-01",
  note: "Makan siang",
  category: { id: MAKAN, name: "Makan", icon: "utensils" },
  createdAt: "2026-11-01T05:00:00.000Z",
  updatedAt: "2026-11-01T05:00:00.000Z",
};

const listKey = transactionKeys.list({ page: 1, pageSize: 20 });
const firstPage: TransactionPage = {
  data: [existing],
  page: 1,
  pageSize: 20,
  total: 1,
};

const input: TransactionInput = {
  type: "expense",
  categoryId: MAKAN,
  amount: 12_000,
  date: "2026-11-10",
  note: "Kopi",
};

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup<Result>(hook: () => Result) {
  const utils = renderHookWithProviders(hook);
  utils.queryClient.setQueryData(listKey, firstPage);
  utils.queryClient.setQueryData(categoryKeys.all, categories);
  const list = () => utils.queryClient.getQueryData<TransactionPage>(listKey);
  const toast = () => utils.store.getState().toast.current;
  return { ...utils, list, toast };
}

const serverError = () =>
  new ApiError({ status: 500, code: "unknown", message: "x" });

afterEach(() => fetchApi.mockReset());

describe("useCreateTransaction", () => {
  it("shows the new transaction at once, then confirms with a toast", async () => {
    const request = deferred<TransactionDto>();
    fetchApi.mockReturnValue(request.promise);
    const { result, list, toast } = setup(() => useCreateTransaction());

    act(() => result.current.mutate(input));

    await waitFor(() => expect(list()?.total).toBe(2));
    expect(list()?.data[0]).toMatchObject({
      id: expect.stringMatching(/^optimistic-/),
      amount: 12_000,
      note: "Kopi",
      category: { id: MAKAN, name: "Makan", icon: "utensils" },
    });
    expect(fetchApi).toHaveBeenCalledWith("/api/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    });

    await act(async () => request.resolve({ ...existing, id: "new" }));
    await waitFor(() => expect(toast()?.message).toBe("Transaksi disimpan"));
  });

  it("puts everything back and offers to try again when it fails", async () => {
    fetchApi.mockRejectedValueOnce(serverError());
    const { result, list, toast, store } = setup(() => useCreateTransaction());

    act(() => result.current.mutate(input));

    await waitFor(() =>
      expect(toast()?.message).toBe(
        "Transaksi gagal disimpan. Periksa koneksi lalu coba lagi.",
      ),
    );
    expect(list()).toEqual(firstPage);
    expect(toast()?.actionLabel).toBe("Coba lagi");

    fetchApi.mockResolvedValueOnce({ ...existing, id: "new" });
    act(() => {
      store.dispatch(runToastAction(toast()?.id ?? ""));
    });
    await waitFor(() => expect(fetchApi).toHaveBeenCalledTimes(2));
    expect(fetchApi).toHaveBeenLastCalledWith("/api/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("says what the server refused, without a retry that cannot help", async () => {
    fetchApi.mockRejectedValueOnce(
      new ApiError({
        status: 400,
        code: "validation_error",
        message: "Data tidak valid",
        fieldErrors: { categoryId: ["Kategori tidak ditemukan"] },
      }),
    );
    const { result, toast } = setup(() => useCreateTransaction());

    act(() => result.current.mutate(input));

    await waitFor(() =>
      expect(toast()?.message).toBe(
        "Transaksi gagal disimpan. Kategori tidak ditemukan",
      ),
    );
    expect(toast()?.actionLabel).toBeUndefined();
  });
});

describe("useUpdateTransaction", () => {
  it("changes the row at once", async () => {
    fetchApi.mockReturnValue(new Promise(() => {}));
    const { result, list } = setup(() => useUpdateTransaction());

    act(() => result.current.mutate({ id: existing.id, values: { ...input } }));

    await waitFor(() => expect(list()?.data[0]?.amount).toBe(12_000));
    expect(list()?.data[0]).toMatchObject({ id: existing.id, note: "Kopi" });
    expect(fetchApi).toHaveBeenCalledWith(`/api/transactions/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  });

  it("puts the old row back when it fails", async () => {
    fetchApi.mockRejectedValueOnce(serverError());
    const { result, list, toast } = setup(() => useUpdateTransaction());

    act(() => result.current.mutate({ id: existing.id, values: input }));

    await waitFor(() =>
      expect(toast()?.message).toMatch(/^Transaksi gagal disimpan\./),
    );
    expect(list()).toEqual(firstPage);
  });
});

describe("useDeleteTransaction", () => {
  it("removes the row at once and can undo by adding it again", async () => {
    fetchApi.mockResolvedValueOnce(undefined);
    const { result, list, toast, store } = setup(() => useDeleteTransaction());

    act(() => result.current.mutate(existing.id));

    await waitFor(() => expect(toast()?.message).toBe("Transaksi dihapus"));
    expect(list()).toMatchObject({ data: [], total: 0 });
    expect(fetchApi).toHaveBeenCalledWith(`/api/transactions/${existing.id}`, {
      method: "DELETE",
    });
    expect(toast()?.actionLabel).toBe("Urungkan");

    fetchApi.mockResolvedValueOnce({ ...existing, id: "again" });
    act(() => {
      store.dispatch(runToastAction(toast()?.id ?? ""));
    });

    await waitFor(() =>
      expect(toast()?.message).toBe("Transaksi dikembalikan"),
    );
    expect(fetchApi).toHaveBeenLastCalledWith("/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        type: existing.type,
        categoryId: existing.category.id,
        amount: existing.amount,
        date: existing.date,
        note: existing.note,
      }),
    });
  });

  it("brings the row back when deleting fails", async () => {
    fetchApi.mockRejectedValueOnce(serverError());
    const { result, list, toast } = setup(() => useDeleteTransaction());

    act(() => result.current.mutate(existing.id));

    await waitFor(() =>
      expect(toast()?.message).toBe(
        "Transaksi gagal dihapus. Periksa koneksi lalu coba lagi.",
      ),
    );
    expect(list()).toEqual(firstPage);
  });
});
