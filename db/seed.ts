// Usage: npm run db:seed. Resets the demo account in the database that
// DATABASE_URL points to.
import "./load-env";

import { seedDemoUser } from "./demo/seed-demo-user";
import { db, pool } from "./index";

async function main() {
  try {
    const result = await seedDemoUser(db);
    console.log(
      `Demo account seeded up to ${result.today}: ${result.categories} categories, ${result.transactions} transactions.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
