/**
 * @jest-environment node
 */
import { z } from "zod";

import {
  apiError,
  invalidFields,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "./http";

const schema = z.strictObject({ amount: z.number().positive() });

function post(body: string, contentType: string | null = "application/json") {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers,
    body,
  });
}

describe("apiError", () => {
  it("sends the error as JSON with the status", async () => {
    const response = apiError(404, "not_found", "Tidak ada");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "Tidak ada" },
    });
  });

  it("has shortcuts for 401 and 404", () => {
    expect(unauthorized().status).toBe(401);
    expect(notFound().status).toBe(404);
  });
});

describe("validationError", () => {
  it("lists the problems per field and for the whole body", async () => {
    const result = schema.safeParse({ amount: -1, userId: "x" });
    if (result.success) throw new Error("expected a failure");

    const response = validationError(result.error);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("validation_error");
    expect(body.error.fieldErrors.amount).toHaveLength(1);
    expect(body.error.formErrors).toEqual(['Unrecognized key: "userId"']);
  });
});

describe("invalidFields", () => {
  it("reports one field the schema could not check", async () => {
    const body = await invalidFields({
      categoryId: ["Kategori tidak ada"],
    }).json();
    expect(body.error).toEqual({
      code: "validation_error",
      message: "Data tidak valid",
      fieldErrors: { categoryId: ["Kategori tidak ada"] },
      formErrors: [],
    });
  });
});

describe("readJson", () => {
  it("returns the parsed body", async () => {
    const result = await readJson(post('{"amount":5}'), schema);
    expect(result).toEqual({ ok: true, data: { amount: 5 } });
  });

  it("accepts a charset in the content type", async () => {
    const result = await readJson(
      post('{"amount":5}', "application/json; charset=utf-8"),
      schema,
    );
    expect(result.ok).toBe(true);
  });

  it.each([null, "text/plain", "application/x-www-form-urlencoded"])(
    "refuses content type %p with 415",
    async (contentType) => {
      const result = await readJson(post('{"amount":5}', contentType), schema);
      expect(!result.ok && result.response.status).toBe(415);
    },
  );

  it("refuses broken JSON with 400 invalid_json", async () => {
    const result = await readJson(post("{amount:"), schema);
    if (result.ok) throw new Error("expected a failure");
    expect(result.response.status).toBe(400);
    expect((await result.response.json()).error.code).toBe("invalid_json");
  });

  it("refuses a body that fails the schema with 400 validation_error", async () => {
    const result = await readJson(post('{"amount":0}'), schema);
    if (result.ok) throw new Error("expected a failure");
    expect(result.response.status).toBe(400);
    expect(
      (await result.response.json()).error.fieldErrors.amount,
    ).toHaveLength(1);
  });
});
