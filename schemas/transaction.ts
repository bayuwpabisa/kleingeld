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

const fields = {
  type: z.enum(TRANSACTION_TYPES, {
    error: "Pilih pemasukan atau pengeluaran",
  }),
  categoryId: z.uuid({ error: "Pilih kategori" }),
  // Whole rupiah. The sign is in `type`, so the amount is always positive.
  amount: z
    .number({ error: "Nominal harus berupa angka" })
    .int({ error: "Nominal harus bilangan bulat" })
    .positive({ error: "Nominal harus lebih dari 0" })
    .max(MAX_AMOUNT, { error: "Nominal maksimal Rp1.000.000.000.000" }),
  // A calendar date without a time zone, "YYYY-MM-DD".
  date: z.iso.date({ error: "Tanggal tidak valid" }),
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

export const transactionListQuerySchema = z.object({
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
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

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
