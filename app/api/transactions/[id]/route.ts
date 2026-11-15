import { z } from "zod";

import { db } from "@/db";
import { categoryProblem } from "@/features/transactions/server/responses";
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/features/transactions/server/transactions-repo";
import { notFound, readJson, unauthorized } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { transactionUpdateSchema } from "@/schemas/transaction";

type Context = RouteContext<"/api/transactions/[id]">;

const idSchema = z.uuid();

/** The id from the URL, or null when it cannot be a transaction id. */
async function transactionId(context: Context) {
  const { id } = await context.params;
  return idSchema.safeParse(id).success ? id : null;
}

// A transaction of another user answers 404, the same as one that does not
// exist, so ids of other users' data cannot be probed.

/** GET /api/transactions/[id] */
export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = await transactionId(context);
  if (!id) return notFound();

  const transaction = await getTransaction(db, user.id, id);
  return transaction ? Response.json(transaction) : notFound();
}

/** PATCH /api/transactions/[id]: changes only the fields in the body. */
export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = await transactionId(context);
  if (!id) return notFound();

  const body = await readJson(request, transactionUpdateSchema);
  if (!body.ok) return body.response;

  const result = await updateTransaction(db, user.id, id, body.data);
  if (result.ok) return Response.json(result.data);
  return result.reason === "not_found"
    ? notFound()
    : categoryProblem(result.reason);
}

/** DELETE /api/transactions/[id]: answers 204 with no body. */
export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = await transactionId(context);
  if (!id) return notFound();

  const deleted = await deleteTransaction(db, user.id, id);
  return deleted ? new Response(null, { status: 204 }) : notFound();
}
