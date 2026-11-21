import { db } from "@/db";
import { summarizeTransactions } from "@/features/transactions/server/transactions-repo";
import { unauthorized, validationError } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { transactionFiltersSchema } from "@/schemas/transaction";

/**
 * GET /api/transactions/summary?q=&type=&category=&from=&to=: income,
 * expense and balance of the user's transactions that match, with the same
 * filters as GET /api/transactions. Sort and page are ignored.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const filters = transactionFiltersSchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!filters.success) return validationError(filters.error);

  return Response.json(await summarizeTransactions(db, user.id, filters.data));
}
