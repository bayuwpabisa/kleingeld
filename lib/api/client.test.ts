/**
 * @jest-environment node
 */
import { ApiError, apiFetch } from "./client";

const fetchMock = jest.spyOn(globalThis, "fetch");

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

afterEach(() => {
  fetchMock.mockReset();
});

afterAll(() => {
  fetchMock.mockRestore();
});

describe("apiFetch", () => {
  it("returns the JSON body", async () => {
    respond({ data: [], total: 0 });
    await expect(apiFetch("/api/transactions")).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it("passes the abort signal and asks for JSON", async () => {
    respond({});
    const controller = new AbortController();

    await apiFetch("/api/transactions", { signal: controller.signal });

    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe("/api/transactions");
    expect(init?.signal).toBe(controller.signal);
    expect(new Headers(init?.headers).get("accept")).toBe("application/json");
  });

  it("sends a body as JSON", async () => {
    respond({}, 201);

    await apiFetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify({ amount: 1 }),
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/json",
    );
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch("/api/transactions/x")).resolves.toBeUndefined();
  });

  it("turns the API's error body into an ApiError", async () => {
    respond(
      {
        error: {
          code: "validation_error",
          message: "Data tidak valid",
          fieldErrors: { amount: ["Nominal harus lebih dari 0"] },
          formErrors: [],
        },
      },
      400,
    );

    const error = await apiFetch("/api/transactions").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "validation_error",
      message: "Data tidak valid",
      fieldErrors: { amount: ["Nominal harus lebih dari 0"] },
      formErrors: [],
    });
  });

  it("gives a general message when the error has no API body", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad gateway</html>", { status: 502 }),
    );

    const error = await apiFetch("/api/transactions").catch((e: unknown) => e);

    expect(error).toMatchObject({
      status: 502,
      code: "unknown",
      message: "Terjadi kesalahan di server. Coba lagi nanti.",
    });
  });

  it("lets network failures through as they are", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiFetch("/api/transactions")).rejects.toThrow(TypeError);
  });
});
