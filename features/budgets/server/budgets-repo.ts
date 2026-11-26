import { and, count, eq, gte, lte, sum } from "drizzle-orm";

import { budgets, categories, transactions } from "@/db/schema";
import type { AppDb, DbExecutor } from "@/db/types";
import { monthRange } from "@/features/transactions/periods";
import type {
  BudgetDto,
  BudgetInput,
  BudgetStatus,
  BudgetUpdate,
} from "@/schemas/budget";

// Server only. Every function takes the signed-in user's id and scopes each
// query to it; another user's budget looks exactly like one that does not
// exist.

export type CreateProblem =
  "category_not_found" | "category_not_expense" | "duplicate";

export type WriteResult<Reason extends string> =
  { ok: true; data: BudgetDto } | { ok: false; reason: Reason };

const byName = new Intl.Collator("id-ID").compare;

const dtoColumns = {
  id: budgets.id,
  amount: budgets.amount,
  category: {
    id: categories.id,
    name: categories.name,
    icon: categories.icon,
  },
};

const ownedBy = (userId: string, id: string) =>
  and(eq(budgets.id, id), eq(budgets.userId, userId));

async function findOwned(
  db: DbExecutor,
  userId: string,
  id: string,
): Promise<BudgetDto | null> {
  const [row] = await db
    .select(dtoColumns)
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .where(ownedBy(userId, id))
    .limit(1);
  return row ?? null;
}

/**
 * The user's budgets with the expenses of each budget's category in `month`
 * ("YYYY-MM"), sorted by category name. Sorted here, not in SQL, so the
 * order does not depend on the database's collation (Neon and PGlite differ).
 */
export async function listBudgetStatus(
  db: AppDb,
  userId: string,
  month: string,
): Promise<BudgetStatus[]> {
  const { from, to } = monthRange(month);
  const rows = await db
    .select({
      ...dtoColumns,
      // Postgres sums a bigint as numeric, which arrives as a string; no
      // matching expense gives null.
      spent: sum(transactions.amount),
      count: count(transactions.id),
    })
    .from(budgets)
    .innerJoin(categories, eq(categories.id, budgets.categoryId))
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, budgets.categoryId),
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    )
    .where(eq(budgets.userId, userId))
    .groupBy(budgets.id, categories.id);

  return rows
    .map(({ spent, ...row }) => ({ ...row, spent: Number(spent ?? 0) }))
    .sort((a, b) => byName(a.category.name, b.category.name));
}

/**
 * Adds a budget. The category must be one of the user's expense categories
 * and may not have a budget yet.
 */
export function createBudget(
  db: AppDb,
  userId: string,
  input: BudgetInput,
): Promise<WriteResult<CreateProblem>> {
  return db.transaction(async (tx) => {
    const [category] = await tx
      .select({ type: categories.type })
      .from(categories)
      .where(
        and(eq(categories.id, input.categoryId), eq(categories.userId, userId)),
      )
      .limit(1);
    if (!category) return { ok: false, reason: "category_not_found" };
    if (category.type !== "expense") {
      return { ok: false, reason: "category_not_expense" };
    }

    // The unique (user, category) constraint decides, so two requests at
    // the same time cannot both add one.
    const [created] = await tx
      .insert(budgets)
      .values({ userId, categoryId: input.categoryId, amount: input.amount })
      .onConflictDoNothing({ target: [budgets.userId, budgets.categoryId] })
      .returning({ id: budgets.id });
    if (!created) return { ok: false, reason: "duplicate" };

    const data = await findOwned(tx, userId, created.id);
    if (!data) throw new Error("The new budget could not be read back");
    return { ok: true, data };
  });
}

/** Changes the limit of one of the user's budgets. */
export async function updateBudget(
  db: AppDb,
  userId: string,
  id: string,
  patch: BudgetUpdate,
): Promise<WriteResult<"not_found">> {
  const updated = await db
    .update(budgets)
    .set({ amount: patch.amount })
    .where(ownedBy(userId, id))
    .returning({ id: budgets.id });
  if (updated.length === 0) return { ok: false, reason: "not_found" };

  const data = await findOwned(db, userId, id);
  if (!data) throw new Error("The updated budget could not be read back");
  return { ok: true, data };
}

/** True when a budget was deleted; false when the user has no such budget. */
export async function deleteBudget(
  db: AppDb,
  userId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(budgets)
    .where(ownedBy(userId, id))
    .returning({ id: budgets.id });
  return deleted.length > 0;
}
