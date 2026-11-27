import { eq } from "drizzle-orm";

// Relative, not "@/": db/seed.ts runs this file with tsx, outside Next.
import { todayInJakarta } from "../../lib/date";
import { defaultCategoriesFor } from "../default-categories";
import { budgets, categories, transactions, users } from "../schema";
import type { AppDb } from "../types";
import { buildDemoBudgets } from "./build-demo-budgets";
import { buildDemoTransactions } from "./build-demo-transactions";
import { DEMO_CUSTOM_CATEGORIES, DEMO_USER } from "./demo-user";

/**
 * Resets the demo account to fresh data: about six months of transactions
 * up to `today`, and budgets sized from this month's spending. Safe to run
 * again (the demo login and a daily job will call it); the user row is kept,
 * so its sessions survive a reset.
 */
export async function seedDemoUser(db: AppDb, today = todayInJakarta()) {
  return db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ ...DEMO_USER, emailVerified: true })
      .onConflictDoUpdate({
        target: users.id,
        set: { name: DEMO_USER.name, email: DEMO_USER.email },
      });

    await tx.delete(transactions).where(eq(transactions.userId, DEMO_USER.id));
    // Budgets go with their categories (ON DELETE CASCADE).
    await tx.delete(categories).where(eq(categories.userId, DEMO_USER.id));

    const insertedCategories = await tx
      .insert(categories)
      .values([
        ...defaultCategoriesFor(DEMO_USER.id),
        ...DEMO_CUSTOM_CATEGORIES.map((c) => ({
          ...c,
          userId: DEMO_USER.id,
          isDefault: false,
        })),
      ])
      .returning({
        id: categories.id,
        name: categories.name,
        type: categories.type,
      });

    const rows = buildDemoTransactions({
      today,
      categories: insertedCategories,
    });
    await tx
      .insert(transactions)
      .values(rows.map((row) => ({ ...row, userId: DEMO_USER.id })));

    const budgetRows = buildDemoBudgets({
      today,
      categories: insertedCategories,
      transactions: rows,
    });
    await tx
      .insert(budgets)
      .values(budgetRows.map((row) => ({ ...row, userId: DEMO_USER.id })));

    return {
      today,
      categories: insertedCategories.length,
      transactions: rows.length,
      budgets: budgetRows.length,
    };
  });
}
