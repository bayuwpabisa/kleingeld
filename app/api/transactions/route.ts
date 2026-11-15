import { db } from "@/db";
import { categoryProblem } from "@/features/transactions/server/responses";
import {
  createTransaction,
  listTransactions,
} from "@/features/transactions/server/transactions-repo";
import { readJson, unauthorized, validationError } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import {
  transactionInputSchema,
  transactionListQuerySchema,
} from "@/schemas/transaction";

// The user always comes from the session, never from the request, and every
// query is scoped to that user (features/transactions/server).

/** GET /api/transactions?page=1&pageSize=20: the user's transactions. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const query = transactionListQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!query.success) return validationError(query.error);

  return Response.json(await listTransactions(db, user.id, query.data));
}

/** POST /api/transactions: adds a transaction, answers 201 with it. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(request, transactionInputSchema);
  if (!body.ok) return body.response;

  const result = await createTransaction(db, user.id, body.data);
  if (!result.ok) return categoryProblem(result.reason);

  return Response.json(result.data, {
    status: 201,
    headers: { Location: `/api/transactions/${result.data.id}` },
  });
}
