import { z } from "zod";

// JSON responses for Route Handlers. Every error has the same shape, so the
// client can show `message` and map `fieldErrors` onto form fields.

export type ApiErrorCode =
  | "unauthorized"
  | "not_found"
  | "invalid_json"
  | "validation_error"
  | "unsupported_media_type";

export type FieldErrors = Partial<Record<string, string[]>>;

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: FieldErrors;
    formErrors?: string[];
  };
};

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details: Pick<ApiErrorBody["error"], "fieldErrors" | "formErrors"> = {},
) {
  const body: ApiErrorBody = { error: { code, message, ...details } };
  return Response.json(body, { status });
}

export const unauthorized = () =>
  apiError(401, "unauthorized", "Silakan masuk terlebih dahulu");

export const notFound = () =>
  apiError(404, "not_found", "Data tidak ditemukan");

/** 400 with the problems of a Zod parse, per field and for the whole body. */
export function validationError(error: z.ZodError) {
  const { fieldErrors, formErrors } = z.flattenError(error);
  return apiError(400, "validation_error", "Data tidak valid", {
    fieldErrors,
    formErrors,
  });
}

/** 400 for problems found after parsing, e.g. a category that is not yours. */
export function invalidFields(fieldErrors: FieldErrors) {
  return apiError(400, "validation_error", "Data tidak valid", {
    fieldErrors,
    formErrors: [],
  });
}

export type ReadJsonResult<T> =
  { ok: true; data: T } | { ok: false; response: Response };

/**
 * Reads a JSON request body and parses it with `schema`. Only
 * `application/json` is accepted: a plain HTML form on another site cannot
 * send that without a CORS preflight, so mutations cannot be forged that way.
 */
export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ReadJsonResult<z.output<S>>> {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return {
      ok: false,
      response: apiError(
        415,
        "unsupported_media_type",
        "Kirim data sebagai application/json",
      ),
    };
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Data bukan JSON yang valid"),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, response: validationError(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
