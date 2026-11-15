import { and, desc, eq } from "drizzle-orm";

import { categories, transactions } from "@/db/schema";
import type { AppDb, DbExecutor } from "@/db/types";
import type {
  TransactionDto,
  TransactionInput,
  TransactionListQuery,
  TransactionPage,
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

export async function listTransactions(
  db: AppDb,
  userId: string,
  { page, pageSize }: TransactionListQuery,
): Promise<TransactionPage> {
  const where = eq(transactions.userId, userId);
  const [rows, total] = await Promise.all([
    selectDtos(db)
      .where(where)
      // Same date: the one entered last comes first; id keeps it stable.
      .orderBy(
        desc(transactions.date),
        desc(transactions.createdAt),
        desc(transactions.id),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(transactions, where),
  ]);
  return { data: rows.map(toDto), page, pageSize, total };
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
