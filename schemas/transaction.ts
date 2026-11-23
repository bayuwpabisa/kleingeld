import { z } from "zod";

// One contract for the API and the forms: route handlers parse requests with
// these schemas, and the client reuses the same schemas and types.
// No database imports here, so this file is safe to bundle for the browser.

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Rp1 triliun: far above any personal transaction, and a safe JS integer. */
export const MAX_AMOUNT = 1_000_000_000_000;
export const MAX_NOTE_LENGTH = 200;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 100;

export const SORT_FIELDS = ["date", "amount"] as const;
export const SORT_ORDERS = ["asc", "desc"] as const;

const fields = {
  type: z.enum(TRANSACTION_TYPES, {
    error: "Pilih pemasukan atau pengeluaran",
  }),
  categoryId: z.uuid({ error: "Pilih kategori" }),
  // Whole rupiah. The sign is in `type`, so the amount is always positive.
  amount: z
    .number({
      // An empty amount field in the form gives undefined or NaN.
      error: (issue) =>
        issue.input === undefined || Number.isNaN(issue.input)
          ? "Isi nominal"
          : "Nominal harus berupa angka",
    })
    .int({ error: "Nominal harus bilangan bulat" })
    .positive({ error: "Nominal harus lebih dari 0" })
    .max(MAX_AMOUNT, { error: "Nominal maksimal Rp1.000.000.000.000" }),
  // A calendar date without a time zone, "YYYY-MM-DD".
  date: z.iso.date({
    error: (issue) =>
      issue.input === "" || issue.input === undefined
        ? "Pilih tanggal"
        : "Tanggal tidak valid",
  }),
  // A blank note is stored as null. A missing note stays missing, so an
  // update without `note` leaves the old note alone.
  note: z
    .string({ error: "Catatan harus berupa teks" })
    .trim()
    .max(MAX_NOTE_LENGTH, {
      error: `Catatan maksimal ${MAX_NOTE_LENGTH} karakter`,
    })
    .nullish()
    .transform((note) => (note === undefined ? undefined : note || null)),
};

// strictObject: unknown keys such as `userId` are rejected, not ignored.
// This message covers problems with the body itself; fields have their own.
const bodyOptions = {
  error: (issue: z.core.$ZodRawIssue) =>
    issue.code === "unrecognized_keys"
      ? `Field tidak dikenal: ${issue.keys.join(", ")}`
      : "Data harus berupa objek JSON",
};

export const transactionInputSchema = z.strictObject(fields, bodyOptions);

export const transactionUpdateSchema = z
  .strictObject(fields, bodyOptions)
  .partial()
  .refine((patch) => Object.values(patch).some((v) => v !== undefined), {
    error: "Tidak ada perubahan",
  });

// The list's query string. The page's URL uses the same names
// (features/transactions/list-query-url.ts), so a filtered list can be shared.
export const listQueryFields = {
  // Matches the note or the category name, ignoring case.
  q: z
    .string({ error: "Kata kunci tidak valid" })
    .trim()
    .max(MAX_SEARCH_LENGTH, {
      error: `Kata kunci maksimal ${MAX_SEARCH_LENGTH} karakter`,
    })
    .transform((q) => q || undefined)
    .optional(),
  type: z.enum(TRANSACTION_TYPES, { error: "Tipe tidak valid" }).optional(),
  category: z.uuid({ error: "Kategori tidak valid" }).optional(),
  // Both ends are included.
  from: z.iso.date({ error: "Tanggal awal tidak valid" }).optional(),
  to: z.iso.date({ error: "Tanggal akhir tidak valid" }).optional(),
  sort: z.enum(SORT_FIELDS, { error: "Urutan tidak valid" }).default("date"),
  order: z.enum(SORT_ORDERS, { error: "Urutan tidak valid" }).default("desc"),
  page: z.coerce
    .number({ error: "Halaman tidak valid" })
    .int({ error: "Halaman tidak valid" })
    .min(1, { error: "Halaman tidak valid" })
    .default(1),
  pageSize: z.coerce
    .number({ error: "Ukuran halaman tidak valid" })
    .int({ error: "Ukuran halaman tidak valid" })
    .min(1, { error: "Ukuran halaman tidak valid" })
    .max(MAX_PAGE_SIZE, { error: "Ukuran halaman tidak valid" })
    .default(DEFAULT_PAGE_SIZE),
};

const rangeInOrder = {
  check: (range: { from?: string; to?: string }) =>
    !range.from || !range.to || range.from <= range.to,
  options: { error: "Tanggal awal harus sebelum tanggal akhir", path: ["to"] },
};

/** Which transactions: used by the list and by the summary. */
export const transactionFiltersSchema = z
  .object({
    q: listQueryFields.q,
    type: listQueryFields.type,
    category: listQueryFields.category,
    from: listQueryFields.from,
    to: listQueryFields.to,
  })
  .refine(rangeInOrder.check, rangeInOrder.options);

/** GET /api/transactions: the filters, the order and the page. */
export const transactionListQuerySchema = z
  .object(listQueryFields)
  .refine(rangeInOrder.check, rangeInOrder.options);

/** The longest trend GET /api/transactions/trend gives: two years. */
export const MAX_TREND_MONTHS = 24;

/** "YYYY-MM" with a real month. */
const monthField = (error: string) =>
  z.string({ error }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error });

function monthCount(from: string, to: string) {
  const [fromYear = 0, fromMonth = 1] = from.split("-").map(Number);
  const [toYear = 0, toMonth = 1] = to.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
}

/** GET /api/transactions/trend: the first and the last month, both included. */
export const monthlyTrendQuerySchema = z
  .object({
    from: monthField("Bulan awal tidak valid"),
    to: monthField("Bulan akhir tidak valid"),
  })
  .refine((range) => range.from <= range.to, {
    error: "Bulan awal harus sebelum bulan akhir",
    path: ["to"],
  })
  .refine((range) => monthCount(range.from, range.to) <= MAX_TREND_MONTHS, {
    error: `Rentang maksimal ${MAX_TREND_MONTHS} bulan`,
    path: ["to"],
  });

/** GET /api/transactions/by-category: one type, in an optional date range. */
export const categoryTotalsQuerySchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, { error: "Tipe tidak valid" }),
    from: listQueryFields.from,
    to: listQueryFields.to,
  })
  .refine(rangeInOrder.check, rangeInOrder.options);

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
export type TransactionSort = TransactionListQuery["sort"];
export type SortOrder = TransactionListQuery["order"];
export type MonthlyTrendQuery = z.infer<typeof monthlyTrendQuerySchema>;
export type CategoryTotalsQuery = z.infer<typeof categoryTotalsQuerySchema>;

/** One month of GET /api/transactions/trend; a month without rows is 0. */
export type MonthlyTotal = {
  /** "YYYY-MM" */
  month: string;
  income: number;
  expense: number;
};

/** One category of GET /api/transactions/by-category. */
export type CategoryTotal = {
  category: { id: string; name: string; icon: string };
  total: number;
  count: number;
};

/** Totals of the filtered transactions, from GET /api/transactions/summary. */
export type TransactionSummary = {
  income: { total: number; count: number };
  expense: { total: number; count: number };
  /** Income minus expense; negative when more went out. */
  balance: number;
};

/** A transaction as the API returns it (dates as ISO strings in JSON). */
export type TransactionDto = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  category: { id: string; name: string; icon: string };
  createdAt: string;
  updatedAt: string;
};

export type TransactionPage = {
  data: TransactionDto[];
  page: number;
  pageSize: number;
  total: number;
};
