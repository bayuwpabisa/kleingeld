import { db } from "@/db";
import { monthlyTotals } from "@/features/transactions/server/transactions-repo";
import { unauthorized, validationError } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { monthlyTrendQuerySchema } from "@/schemas/transaction";

/**
 * GET /api/transactions/trend?from=YYYY-MM&to=YYYY-MM: the user's income and
 * expense per month, one entry for every month in the range (both ends
 * included, at most 24), oldest first. A month without transactions is 0.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const query = monthlyTrendQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!query.success) return validationError(query.error);

  return Response.json(await monthlyTotals(db, user.id, query.data));
}
