import { act, waitFor } from "@testing-library/react";

import { ApiError, apiFetch } from "@/lib/api/client";
import { runToastAction } from "@/lib/store/toast-slice";
import type { BudgetDto, BudgetStatus } from "@/schemas/budget";
import { renderHookWithProviders } from "@/test/render-with-providers";

import { budgetKeys } from "./keys";
import { useBudgets } from "./use-budgets";
import { useCreateBudget } from "./use-create-budget";
import { useDeleteBudget } from "./use-delete-budget";
import { useUpdateBudget } from "./use-update-budget";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

const MAKAN = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";
const budget: BudgetDto = {
  id: "0b6e5f00-0000-4000-8000-000000000001",
  category: { id: MAKAN, name: "Makan", icon: "utensils" },
  amount: 1_500_000,
};
const monthKey = budgetKeys.month("2026-11");
const cached: BudgetStatus[] = [{ ...budget, spent: 1_275_000, count: 30 }];

function setup<Result>(hook: () => Result) {
  const utils = renderHookWithProviders(hook);
  utils.queryClient.setQueryData(monthKey, cached);
  const toast = () => utils.store.getState().toast.current;
  const invalidated = () =>
    utils.queryClient.getQueryState(monthKey)?.isInvalidated;
  return { ...utils, toast, invalidated };
}

const serverError = () =>
  new ApiError({ status: 500, code: "unknown", message: "x" });
const duplicate = () =>
  new ApiError({
    status: 409,
    code: "conflict",
    message: "Kategori ini sudah punya budget",
    fieldErrors: { categoryId: ["Kategori ini sudah punya budget"] },
  });

afterEach(() => fetchApi.mockReset());

describe("useBudgets", () => {
  it("loads the month's budgets under its own key", async () => {
    fetchApi.mockResolvedValueOnce(cached);
    const { result, queryClient } = renderHookWithProviders(() =>
      useBudgets("2026-11"),
    );

    await waitFor(() => expect(result.current.data).toEqual(cached));
    expect(fetchApi).toHaveBeenCalledWith("/api/budgets?month=2026-11", {
      signal: expect.any(AbortSignal),
    });
    expect(queryClient.getQueryData(monthKey)).toEqual(cached);
  });
});

describe("budgetKeys", () => {
  it("keeps every month under `all`", () => {
    expect(monthKey).toStrictEqual(["budgets", "month", "2026-11"]);
    expect(monthKey.slice(0, 1)).toStrictEqual(budgetKeys.all);
  });
});

describe("useCreateBudget", () => {
  const input = { categoryId: MAKAN, amount: 1_500_000 };

  it("saves, confirms with a toast and refetches the budgets", async () => {
    fetchApi.mockResolvedValueOnce(budget);
    const { result, toast, invalidated } = setup(() => useCreateBudget());

    act(() => result.current.mutate(input));

    await waitFor(() => expect(toast()?.message).toBe("Budget disimpan"));
    expect(fetchApi).toHaveBeenCalledWith("/api/budgets", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await waitFor(() => expect(invalidated()).toBe(true));
  });

  it("leaves a failure to the form, without a toast", async () => {
    fetchApi.mockRejectedValueOnce(duplicate());
    const { result, toast } = setup(() => useCreateBudget());

    act(() => result.current.mutate(input));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 409 });
    expect(toast()).toBeNull();
  });

  it("can report failures in a toast instead, for Urungkan", async () => {
    fetchApi.mockRejectedValueOnce(duplicate());
    const { result, toast } = setup(() =>
      useCreateBudget({ toastErrors: true }),
    );

    act(() => result.current.mutate(input));

    await waitFor(() =>
      expect(toast()?.message).toBe(
        "Budget gagal disimpan. Kategori ini sudah punya budget",
      ),
    );
    expect(toast()?.actionLabel).toBeUndefined();
  });
});

describe("useUpdateBudget", () => {
  it("saves the new limit and refetches the budgets", async () => {
    fetchApi.mockResolvedValueOnce({ ...budget, amount: 2_000_000 });
    const { result, toast, invalidated } = setup(() => useUpdateBudget());

    act(() =>
      result.current.mutate({ id: budget.id, values: { amount: 2_000_000 } }),
    );

    await waitFor(() => expect(toast()?.message).toBe("Budget disimpan"));
    expect(fetchApi).toHaveBeenCalledWith(`/api/budgets/${budget.id}`, {
      method: "PATCH",
      body: JSON.stringify({ amount: 2_000_000 }),
    });
    await waitFor(() => expect(invalidated()).toBe(true));
  });

  it("leaves a failure to the form, without a toast", async () => {
    fetchApi.mockRejectedValueOnce(serverError());
    const { result, toast } = setup(() => useUpdateBudget());

    act(() => result.current.mutate({ id: budget.id, values: { amount: 1 } }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast()).toBeNull();
  });
});

describe("useDeleteBudget", () => {
  it("deletes, refetches and can undo by adding the same budget again", async () => {
    fetchApi.mockResolvedValueOnce(undefined);
    const { result, toast, invalidated, store } = setup(() =>
      useDeleteBudget(),
    );

    act(() => result.current.mutate(budget));

    await waitFor(() => expect(toast()?.message).toBe("Budget dihapus"));
    expect(fetchApi).toHaveBeenCalledWith(`/api/budgets/${budget.id}`, {
      method: "DELETE",
    });
    expect(toast()?.actionLabel).toBe("Urungkan");
    await waitFor(() => expect(invalidated()).toBe(true));

    fetchApi.mockResolvedValueOnce({ ...budget, id: "again" });
    act(() => {
      store.dispatch(runToastAction(toast()?.id ?? ""));
    });

    await waitFor(() => expect(toast()?.message).toBe("Budget dikembalikan"));
    expect(fetchApi).toHaveBeenLastCalledWith("/api/budgets", {
      method: "POST",
      body: JSON.stringify({ categoryId: MAKAN, amount: 1_500_000 }),
    });
  });

  it("offers to try again when deleting fails", async () => {
    fetchApi.mockRejectedValueOnce(serverError());
    const { result, toast, store } = setup(() => useDeleteBudget());

    act(() => result.current.mutate(budget));

    await waitFor(() =>
      expect(toast()?.message).toBe(
        "Budget gagal dihapus. Periksa koneksi lalu coba lagi.",
      ),
    );
    expect(toast()?.actionLabel).toBe("Coba lagi");

    fetchApi.mockResolvedValueOnce(undefined);
    act(() => {
      store.dispatch(runToastAction(toast()?.id ?? ""));
    });
    await waitFor(() => expect(fetchApi).toHaveBeenCalledTimes(2));
    expect(fetchApi).toHaveBeenLastCalledWith(`/api/budgets/${budget.id}`, {
      method: "DELETE",
    });
  });
});
