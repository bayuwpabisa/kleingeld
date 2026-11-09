import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Column names are camelCase here and snake_case in Postgres
// (`casing: "snake_case"` in db/index.ts and drizzle.config.ts).

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
]);

// Core user fields of Better Auth, so its Drizzle adapter (usePlural) can use
// this table as is. Sessions, accounts and verifications come with auth.
export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

// Every user gets their own copy of the default categories (isDefault), so
// editing and deleting work the same for default and custom ones.
export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    type: transactionType().notNull(),
    // A lucide-react icon name, e.g. "utensils".
    icon: text().notNull(),
    isDefault: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    unique("categories_user_type_name_unique").on(t.userId, t.type, t.name),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // RESTRICT: a category that still has transactions cannot be deleted.
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    type: transactionType().notNull(),
    // Whole rupiah, always positive; `type` says which way the money went.
    amount: bigint({ mode: "number" }).notNull(),
    // Calendar date without a time zone, as "YYYY-MM-DD".
    date: date({ mode: "string" }).notNull(),
    note: text(),
    ...timestamps,
  },
  (t) => [
    check("transactions_amount_positive", sql`${t.amount} > 0`),
    index("transactions_user_date_idx").on(t.userId, t.date),
    index("transactions_user_category_date_idx").on(
      t.userId,
      t.categoryId,
      t.date,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionType = (typeof transactionType.enumValues)[number];
