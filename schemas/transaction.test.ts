/**
 * @jest-environment node
 */
import { z } from "zod";
import {
  MAX_AMOUNT,
  MAX_NOTE_LENGTH,
  MAX_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
  transactionFiltersSchema,
  transactionInputSchema,
  transactionListQuerySchema,
  transactionUpdateSchema,
} from "./transaction";

const valid = {
  type: "expense",
  categoryId: "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f",
  amount: 25_000,
  date: "2026-11-11",
  note: "Makan siang",
};

function fieldErrors(result: { success: boolean; error?: z.ZodError }) {
  if (result.success || !result.error) return {};
  return z.flattenError(result.error).fieldErrors as Record<string, string[]>;
}

describe("transactionInputSchema", () => {
  it("accepts a valid transaction", () => {
    expect(transactionInputSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a transaction without a note", () => {
    const withoutNote = {
      type: valid.type,
      categoryId: valid.categoryId,
      amount: valid.amount,
      date: valid.date,
    };
    expect(transactionInputSchema.parse(withoutNote)).toEqual(withoutNote);
  });

  it.each([0, -5, 1.5, MAX_AMOUNT + 1, Number.NaN, "25000"])(
    "rejects amount %p",
    (amount) => {
      const result = transactionInputSchema.safeParse({ ...valid, amount });
      expect(fieldErrors(result).amount).toHaveLength(1);
    },
  );

  it("asks for the amount, the category and the date when they are missing", () => {
    const result = transactionInputSchema.safeParse({
      ...valid,
      amount: undefined,
      categoryId: "",
      date: "",
    });
    expect(fieldErrors(result)).toEqual({
      amount: ["Isi nominal"],
      categoryId: ["Pilih kategori"],
      date: ["Pilih tanggal"],
    });
  });

  it("accepts the largest amount", () => {
    expect(
      transactionInputSchema.safeParse({ ...valid, amount: MAX_AMOUNT })
        .success,
    ).toBe(true);
  });

  it.each(["2026-13-01", "2026-02-30", "15/11/2026", "kemarin", ""])(
    "rejects date %p",
    (date) => {
      const result = transactionInputSchema.safeParse({ ...valid, date });
      expect(fieldErrors(result).date).toHaveLength(1);
    },
  );

  it("rejects an unknown type and a category id that is not a uuid", () => {
    const result = transactionInputSchema.safeParse({
      ...valid,
      type: "transfer",
      categoryId: "makan",
    });
    expect(Object.keys(fieldErrors(result)).sort()).toEqual([
      "categoryId",
      "type",
    ]);
  });

  it("trims the note and turns a blank note into null", () => {
    expect(
      transactionInputSchema.parse({ ...valid, note: "  kopi  " }).note,
    ).toBe("kopi");
    expect(transactionInputSchema.parse({ ...valid, note: "   " }).note).toBe(
      null,
    );
    expect(transactionInputSchema.parse({ ...valid, note: null }).note).toBe(
      null,
    );
  });

  it("rejects a note that is too long", () => {
    const result = transactionInputSchema.safeParse({
      ...valid,
      note: "a".repeat(MAX_NOTE_LENGTH + 1),
    });
    expect(fieldErrors(result).note).toHaveLength(1);
  });

  it("rejects fields it does not know, such as userId", () => {
    const result = transactionInputSchema.safeParse({
      ...valid,
      userId: "someone-else",
    });
    expect(result.error && z.flattenError(result.error).formErrors).toEqual([
      "Field tidak dikenal: userId",
    ]);
  });

  it.each(["teks", 5, null, [valid]])(
    "rejects a body that is not an object: %p",
    (body) => {
      const result = transactionInputSchema.safeParse(body);
      expect(result.error && z.flattenError(result.error).formErrors).toEqual([
        "Data harus berupa objek JSON",
      ]);
    },
  );

  it("gives Indonesian messages", () => {
    const result = transactionInputSchema.safeParse({ ...valid, amount: 0 });
    expect(fieldErrors(result).amount).toEqual(["Nominal harus lebih dari 0"]);
  });
});

describe("transactionUpdateSchema", () => {
  it("accepts one field", () => {
    expect(transactionUpdateSchema.parse({ amount: 10_000 })).toEqual({
      amount: 10_000,
    });
  });

  it("keeps a missing note missing, so an update does not clear it", () => {
    expect(
      transactionUpdateSchema.parse({ amount: 10_000 }),
    ).not.toHaveProperty("note");
  });

  it("clears the note with a blank string", () => {
    expect(transactionUpdateSchema.parse({ note: "" })).toEqual({ note: null });
  });

  it("rejects an empty update", () => {
    expect(transactionUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("uses the same rules as the input schema", () => {
    const result = transactionUpdateSchema.safeParse({ amount: -1 });
    expect(fieldErrors(result).amount).toHaveLength(1);
  });

  it("rejects userId", () => {
    expect(
      transactionUpdateSchema.safeParse({ amount: 1, userId: "x" }).success,
    ).toBe(false);
  });
});

describe("transactionListQuerySchema", () => {
  it("defaults to the newest first page of 20", () => {
    expect(transactionListQuerySchema.parse({})).toEqual({
      sort: "date",
      order: "desc",
      page: 1,
      pageSize: 20,
    });
  });

  it("reads numbers from the query string", () => {
    expect(
      transactionListQuerySchema.parse({ page: "3", pageSize: "50" }),
    ).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("reads filters and sort", () => {
    expect(
      transactionListQuerySchema.parse({
        q: "  kopi ",
        type: "expense",
        category: valid.categoryId,
        from: "2026-11-01",
        to: "2026-11-30",
        sort: "amount",
        order: "asc",
      }),
    ).toEqual({
      q: "kopi",
      type: "expense",
      category: valid.categoryId,
      from: "2026-11-01",
      to: "2026-11-30",
      sort: "amount",
      order: "asc",
      page: 1,
      pageSize: 20,
    });
  });

  it("treats a blank search as no search", () => {
    expect(transactionListQuerySchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("accepts a range of one day", () => {
    expect(
      transactionListQuerySchema.safeParse({
        from: "2026-11-01",
        to: "2026-11-01",
      }).success,
    ).toBe(true);
  });

  it.each([
    { page: "0" },
    { page: "1.5" },
    { page: "abc" },
    { pageSize: "0" },
    { pageSize: String(MAX_PAGE_SIZE + 1) },
    { q: "a".repeat(MAX_SEARCH_LENGTH + 1) },
    { type: "transfer" },
    { category: "not-a-uuid" },
    { from: "2026-13-01" },
    { to: "kemarin" },
    { sort: "note" },
    { order: "up" },
  ])("rejects %p", (query) => {
    expect(transactionListQuerySchema.safeParse(query).success).toBe(false);
  });

  it("rejects a range that ends before it starts", () => {
    const result = transactionListQuerySchema.safeParse({
      from: "2026-11-30",
      to: "2026-11-01",
    });
    expect(fieldErrors(result).to).toEqual([
      "Tanggal awal harus sebelum tanggal akhir",
    ]);
  });
});

describe("transactionFiltersSchema", () => {
  it("has only the filters, without sort or page", () => {
    expect(
      transactionFiltersSchema.parse({
        type: "income",
        sort: "amount",
        page: "2",
      }),
    ).toEqual({ type: "income" });
  });

  it("rejects a range that ends before it starts", () => {
    expect(
      transactionFiltersSchema.safeParse({
        from: "2026-11-30",
        to: "2026-11-01",
      }).success,
    ).toBe(false);
  });
});
