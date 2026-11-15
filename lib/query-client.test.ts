/**
 * @jest-environment node
 */
import { ApiError } from "./api/client";
import { makeQueryClient, shouldRetry } from "./query-client";
import { makeStore } from "./store/store";

function setup() {
  const store = makeStore();
  const onUnauthorized = jest.fn();
  const queryClient = makeQueryClient({
    dispatch: store.dispatch,
    onUnauthorized,
  });
  return { store, onUnauthorized, queryClient };
}

const apiError = (status: number) =>
  new ApiError({ status, code: "unknown", message: "x" });

describe("shouldRetry", () => {
  it("does not retry answers the server meant, such as 400 or 404", () => {
    expect(shouldRetry(0, apiError(400))).toBe(false);
    expect(shouldRetry(0, apiError(404))).toBe(false);
  });

  it("retries server errors and network failures twice", () => {
    expect(shouldRetry(0, apiError(500))).toBe(true);
    expect(shouldRetry(1, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetry(2, apiError(503))).toBe(false);
  });

  it("is the default for queries", () => {
    expect(setup().queryClient.getDefaultOptions().queries?.retry).toBe(
      shouldRetry,
    );
  });
});

describe("errors of queries", () => {
  it("does not toast a first load that fails; the page shows that error", async () => {
    const { store, queryClient } = setup();

    await queryClient.prefetchQuery({
      queryKey: ["x"],
      queryFn: () => Promise.reject(apiError(500)),
      retry: false,
    });

    expect(store.getState().toast.current).toBeNull();
  });

  it("toasts when a refetch fails while old data is still shown", async () => {
    const { store, queryClient } = setup();
    queryClient.setQueryData(["x"], { ok: true });

    await queryClient.prefetchQuery({
      queryKey: ["x"],
      queryFn: () => Promise.reject(apiError(500)),
      retry: false,
      staleTime: 0,
    });

    expect(store.getState().toast.current?.message).toBe(
      "Data gagal diperbarui. Coba lagi nanti.",
    );
  });

  it("sends the user to sign in again on 401", async () => {
    const { store, onUnauthorized, queryClient } = setup();

    await queryClient.prefetchQuery({
      queryKey: ["x"],
      queryFn: () => Promise.reject(apiError(401)),
    });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(store.getState().toast.current).toBeNull();
  });

  it("also handles 401 from mutations", async () => {
    const { onUnauthorized, queryClient } = setup();
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => Promise.reject(apiError(401)),
    });

    await mutation.execute(undefined).catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
