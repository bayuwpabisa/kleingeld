import { db } from "@/db";
import { totalsByCategory } from "@/features/transactions/server/transactions-repo";
import { unauthorized, validationError } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { categoryTotalsQuerySchema } from "@/schemas/transaction";

/**
 * GET /api/transactions/by-category?type=&from=&to=: the user's transactions
 * of one type added up per category, largest total first. The date range is
 * optional (both ends included); other filters are ignored.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const query = categoryTotalsQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!query.success) return validationError(query.error);

  return Response.json(await totalsByCategory(db, user.id, query.data));
}
