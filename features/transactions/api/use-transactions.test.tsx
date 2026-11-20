import { act, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/client";
import type {
  TransactionListQuery,
  TransactionPage,
} from "@/schemas/transaction";
import { renderHookWithProviders } from "@/test/render-with-providers";

import { DEFAULT_LIST_QUERY } from "../list-query-url";
import { useInfiniteTransactions } from "./use-infinite-transactions";
import { useTransactionSummary } from "./use-transaction-summary";
import { useTransactions } from "./use-transactions";

jest.mock("@/lib/api/client", () => ({
  ...jest.requireActual("@/lib/api/client"),
  apiFetch: jest.fn(),
}));

const fetchApi = jest.mocked(apiFetch);

afterEach(() => fetchApi.mockReset());

function emptyPage(page: number, total = 0): TransactionPage {
  return { data: [], page, pageSize: 20, total };
}

describe("useTransactions", () => {
  it("asks the API for the filters, order and page", async () => {
    fetchApi.mockResolvedValue(emptyPage(2));
    renderHookWithProviders(() =>
      useTransactions({
        ...DEFAULT_LIST_QUERY,
        q: "kopi",
        type: "expense",
        sort: "amount",
        page: 2,
      }),
    );
    await waitFor(() =>
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/transactions?q=kopi&type=expense&sort=amount&page=2",
        { signal: expect.any(AbortSignal) },
      ),
    );
  });

  it("cancels the old request when the query changes", async () => {
    const signals: AbortSignal[] = [];
    fetchApi.mockImplementation((_path, init) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise(() => {});
    });
    let query: TransactionListQuery = { ...DEFAULT_LIST_QUERY, q: "ko" };
    const { rerender } = renderHookWithProviders(() => useTransactions(query));
    await waitFor(() => expect(signals).toHaveLength(1));

    query = { ...DEFAULT_LIST_QUERY, q: "kopi" };
    rerender();

    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});

describe("useInfiniteTransactions", () => {
  it("loads the next page until all are loaded", async () => {
    fetchApi
      .mockResolvedValueOnce(emptyPage(1, 30))
      .mockResolvedValueOnce(emptyPage(2, 30));
    const { result } = renderHookWithProviders(() =>
      useInfiniteTransactions({
        sort: "date",
        order: "desc",
        pageSize: 20,
        type: "income",
      }),
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(() => result.current.fetchNextPage());

    expect(fetchApi).toHaveBeenLastCalledWith(
      "/api/transactions?type=income&page=2",
      { signal: expect.any(AbortSignal) },
    );
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });
});

describe("useTransactionSummary", () => {
  it("asks for the summary of the filters only", async () => {
    fetchApi.mockResolvedValue({
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
      balance: 0,
    });
    renderHookWithProviders(() =>
      useTransactionSummary({ from: "2026-11-01", to: "2026-11-30" }),
    );
    await waitFor(() =>
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/transactions/summary?from=2026-11-01&to=2026-11-30",
        { signal: expect.any(AbortSignal) },
      ),
    );
  });
});
