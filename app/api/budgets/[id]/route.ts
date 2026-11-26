import { z } from "zod";

import { db } from "@/db";
import {
  deleteBudget,
  updateBudget,
} from "@/features/budgets/server/budgets-repo";
import { notFound, readJson, unauthorized } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { budgetUpdateSchema } from "@/schemas/budget";

type Context = RouteContext<"/api/budgets/[id]">;

const idSchema = z.uuid();

/** The id from the URL, or null when it cannot be a budget id. */
async function budgetId(context: Context) {
  const { id } = await context.params;
  return idSchema.safeParse(id).success ? id : null;
}

// A budget of another user answers 404, the same as one that does not exist.

/** PATCH /api/budgets/[id]: changes the limit. */
export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = await budgetId(context);
  if (!id) return notFound();

  const body = await readJson(request, budgetUpdateSchema);
  if (!body.ok) return body.response;

  const result = await updateBudget(db, user.id, id, body.data);
  return result.ok ? Response.json(result.data) : notFound();
}

/** DELETE /api/budgets/[id]: answers 204 with no body. */
export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = await budgetId(context);
  if (!id) return notFound();

  const deleted = await deleteBudget(db, user.id, id);
  return deleted ? new Response(null, { status: 204 }) : notFound();
}
