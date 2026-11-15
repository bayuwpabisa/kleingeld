import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sum,
  type SQL,
} from "drizzle-orm";

import { categories, transactions } from "@/db/schema";
import type { AppDb, DbExecutor } from "@/db/types";
import type {
  TransactionDto,
  TransactionFilters,
  TransactionInput,
  TransactionListQuery,
  TransactionPage,
  TransactionSummary,
  TransactionType,
  TransactionUpdate,
} from "@/schemas/transaction";

// Server only. Every function takes the signed-in user's id and scopes each
// query to it, so one user can never read or change another user's rows.
// Rows of other users look exactly like rows that do not exist.

export type CategoryProblem = "category_not_found" | "category_type_mismatch";

export type WriteResult<Reason extends string> =
  { ok: true; data: TransactionDto } | { ok: false; reason: Reason };

const dtoColumns = {
  id: transactions.id,
  type: transactions.type,
  amount: transactions.amount,
  date: transactions.date,
  note: transactions.note,
  createdAt: transactions.createdAt,
  updatedAt: transactions.updatedAt,
  category: {
    id: categories.id,
    name: categories.name,
    icon: categories.icon,
  },
};

// What Drizzle returns for dtoColumns: the DTO, but with Date timestamps.
type DtoRow = Omit<TransactionDto, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

function toDto(row: DtoRow): TransactionDto {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const ownedBy = (userId: string, id: string) =>
  and(eq(transactions.id, id), eq(transactions.userId, userId));

function selectDtos(db: DbExecutor) {
  return db
    .select(dtoColumns)
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId));
}

async function findOwned(db: DbExecutor, userId: string, id: string) {
  const [row] = await selectDtos(db).where(ownedBy(userId, id)).limit(1);
  return row ? toDto(row) : null;
}

/** The category must belong to the user and match the transaction type. */
async function checkCategory(
  db: DbExecutor,
  userId: string,
  categoryId: string,
  type: TransactionType,
): Promise<CategoryProblem | null> {
  const [category] = await db
    .select({ type: categories.type })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!category) return "category_not_found";
  if (category.type !== type) return "category_type_mismatch";
  return null;
}

/** "50%" must find "50%", not everything that starts with 50. */
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * The user's rows that match the filters. It reads the category name, so the
 * query must join categories.
 */
function filterConditions(
  userId: string,
  filters: TransactionFilters,
): SQL | undefined {
  // A row without a note shows its category name, so the search covers both.
  const pattern = filters.q && `%${escapeLike(filters.q)}%`;
  return and(
    eq(transactions.userId, userId),
    pattern
      ? or(ilike(transactions.note, pattern), ilike(categories.name, pattern))
      : undefined,
    filters.type ? eq(transactions.type, filters.type) : undefined,
    filters.category
      ? eq(transactions.categoryId, filters.category)
      : undefined,
    filters.from ? gte(transactions.date, filters.from) : undefined,
    filters.to ? lte(transactions.date, filters.to) : undefined,
  );
}

/**
 * The list's order. Equal values are broken by date, entry time and id, so
 * the order is total and pages never overlap. The client copies these rules
 * for optimistic rows (features/transactions/api/cache.ts).
 */
function orderOf({
  sort,
  order,
}: Pick<TransactionListQuery, "sort" | "order">) {
  const direction = order === "asc" ? asc : desc;
  if (sort === "amount") {
    return [
      direction(transactions.amount),
      desc(transactions.date),
      desc(transactions.createdAt),
      desc(transactions.id),
    ];
  }
  // Same date: newest first lists the one entered last first; oldest first
  // lists the one entered first first.
  return [
    direction(transactions.date),
    direction(transactions.createdAt),
    direction(transactions.id),
  ];
}

export async function listTransactions(
  db: AppDb,
  userId: string,
  query: TransactionListQuery,
): Promise<TransactionPage> {
  const { page, pageSize } = query;
  const where = filterConditions(userId, query);
  const [rows, [counted]] = await Promise.all([
    selectDtos(db)
      .where(where)
      .orderBy(...orderOf(query))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(transactions)
      .innerJoin(categories, eq(categories.id, transactions.categoryId))
      .where(where),
  ]);
  return { data: rows.map(toDto), page, pageSize, total: counted?.total ?? 0 };
}

/** Income, expense and balance of the user's transactions that match. */
export async function summarizeTransactions(
  db: AppDb,
  userId: string,
  filters: TransactionFilters,
): Promise<TransactionSummary> {
  const rows = await db
    .select({
      type: transactions.type,
      count: count(),
      // Postgres sums a bigint as numeric, which arrives as a string.
      total: sum(transactions.amount).mapWith(Number),
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(filterConditions(userId, filters))
    .groupBy(transactions.type);

  const of = (type: TransactionType) => {
    const row = rows.find((r) => r.type === type);
    return { total: row?.total ?? 0, count: row?.count ?? 0 };
  };
  const income = of("income");
  const expense = of("expense");
  return { income, expense, balance: income.total - expense.total };
}

export function getTransaction(db: AppDb, userId: string, id: string) {
  return findOwned(db, userId, id);
}

export function createTransaction(
  db: AppDb,
  userId: string,
  input: TransactionInput,
): Promise<WriteResult<CategoryProblem>> {
  return db.transaction(async (tx) => {
    const problem = await checkCategory(
      tx,
      userId,
      input.categoryId,
      input.type,
    );
    if (problem) return { ok: false, reason: problem };

    const [created] = await tx
      .insert(transactions)
      .values({
        userId,
        type: input.type,
        categoryId: input.categoryId,
        amount: input.amount,
        date: input.date,
        note: input.note ?? null,
      })
      .returning({ id: transactions.id });
    const data = created && (await findOwned(tx, userId, created.id));
    if (!data) throw new Error("The new transaction could not be read back");
    return { ok: true, data };
  });
}

export function updateTransaction(
  db: AppDb,
  userId: string,
  id: string,
  patch: TransactionUpdate,
): Promise<WriteResult<"not_found" | CategoryProblem>> {
  return db.transaction(async (tx) => {
    // Lock the row so the category check and the update see the same values.
    const [current] = await tx
      .select({ type: transactions.type, categoryId: transactions.categoryId })
      .from(transactions)
      .where(ownedBy(userId, id))
      .limit(1)
      .for("update");
    if (!current) return { ok: false, reason: "not_found" };

    if (patch.type !== undefined || patch.categoryId !== undefined) {
      const problem = await checkCategory(
        tx,
        userId,
        patch.categoryId ?? current.categoryId,
        patch.type ?? current.type,
      );
      if (problem) return { ok: false, reason: problem };
    }

    // Drizzle leaves out keys whose value is undefined, so only the given
    // fields change; `note: null` does clear the note.
    await tx
      .update(transactions)
      .set({
        type: patch.type,
        categoryId: patch.categoryId,
        amount: patch.amount,
        date: patch.date,
        note: patch.note,
      })
      .where(ownedBy(userId, id));

    const data = await findOwned(tx, userId, id);
    if (!data)
      throw new Error("The updated transaction could not be read back");
    return { ok: true, data };
  });
}

/** True when a row was deleted; false when the user has no such row. */
export async function deleteTransaction(
  db: AppDb,
  userId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(transactions)
    .where(ownedBy(userId, id))
    .returning({ id: transactions.id });
  return deleted.length > 0;
}
