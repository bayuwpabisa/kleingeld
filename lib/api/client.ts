import type { ApiErrorBody, ApiErrorCode, FieldErrors } from "./http";

// The browser side of the API: TanStack Query hooks call apiFetch, never
// fetch directly (AGENTS.md). Errors from the API become ApiError, with the
// same fields as the JSON error body (lib/api/http.ts).

export class ApiError extends Error {
  readonly status: number;
  /** The API's code, or "unknown" when the answer had no API error body. */
  readonly code: ApiErrorCode | "unknown";
  readonly fieldErrors: FieldErrors;
  readonly formErrors: string[];

  constructor({
    status,
    code,
    message,
    fieldErrors = {},
    formErrors = [],
  }: {
    status: number;
    code: ApiErrorCode | "unknown";
    message: string;
    fieldErrors?: FieldErrors;
    formErrors?: string[];
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return false;
  }
  const { error } = body;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}

/**
 * Calls our own API and returns its JSON. Throws ApiError for an error answer;
 * a network failure is thrown as it is (TanStack Query retries those).
 * The result type is trusted, not checked: the API is ours and typed by the
 * same schemas (schemas/).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  // 204 No Content: callers of such endpoints ask for `void`.
  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => undefined);
  if (response.ok) return body as T;

  if (isApiErrorBody(body)) {
    throw new ApiError({ status: response.status, ...body.error });
  }
  throw new ApiError({
    status: response.status,
    code: "unknown",
    message: "Terjadi kesalahan di server. Coba lagi nanti.",
  });
}
