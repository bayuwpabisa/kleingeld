import { eq } from "drizzle-orm";

import { defaultCategoriesFor } from "../default-categories";
import type { Db } from "../index";
import { categories, transactions, users } from "../schema";
import { buildDemoTransactions } from "./build-demo-transactions";
import { DEMO_CUSTOM_CATEGORIES, DEMO_USER } from "./demo-user";

// The demo's "today" follows Indonesian time (WIB), not the server's zone.
function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

/**
 * Resets the demo account to fresh data: about three months of transactions
 * up to `today`. Safe to run again (the demo login and a daily job will call
 * it); the user row is kept, so its sessions survive a reset.
 */
export async function seedDemoUser(db: Db, today = todayInJakarta()) {
  return db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ ...DEMO_USER, emailVerified: true })
      .onConflictDoUpdate({
        target: users.id,
        set: { name: DEMO_USER.name, email: DEMO_USER.email },
      });

    await tx.delete(transactions).where(eq(transactions.userId, DEMO_USER.id));
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

    return {
      today,
      categories: insertedCategories.length,
      transactions: rows.length,
    };
  });
}
