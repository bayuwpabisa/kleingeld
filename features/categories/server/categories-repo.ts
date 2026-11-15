import { eq } from "drizzle-orm";

import { categories } from "@/db/schema";
import type { AppDb } from "@/db/types";
import type { CategoryDto } from "@/schemas/category";

// Server only, scoped to the signed-in user like every other query.

const typeOrder = { expense: 0, income: 1 } as const;
const byName = new Intl.Collator("id-ID").compare;

/**
 * The user's categories: expenses first (most transactions are expenses),
 * then by name. Sorted here, not in SQL, so the order does not depend on the
 * database's collation (Neon and PGlite differ).
 */
export async function listCategories(
  db: AppDb,
  userId: string,
): Promise<CategoryDto[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      icon: categories.icon,
    })
    .from(categories)
    .where(eq(categories.userId, userId));

  return rows.sort(
    (a, b) => typeOrder[a.type] - typeOrder[b.type] || byName(a.name, b.name),
  );
}
