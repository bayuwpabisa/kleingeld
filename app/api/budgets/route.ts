import { db } from "@/db";
import {
  createBudget,
  listBudgetStatus,
} from "@/features/budgets/server/budgets-repo";
import { createProblem } from "@/features/budgets/server/responses";
import { readJson, unauthorized, validationError } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";
import { budgetInputSchema, budgetListQuerySchema } from "@/schemas/budget";

// The user always comes from the session, never from the request, and every
// query is scoped to that user (features/budgets/server).

/**
 * GET /api/budgets?month=YYYY-MM: the user's budgets, each with the expenses
 * of its category in that month, sorted by category name.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const query = budgetListQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!query.success) return validationError(query.error);

  return Response.json(await listBudgetStatus(db, user.id, query.data.month));
}

/**
 * POST /api/budgets: adds a budget for one of the user's expense categories,
 * answers 201 with it; 409 when that category already has one.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(request, budgetInputSchema);
  if (!body.ok) return body.response;

  const result = await createBudget(db, user.id, body.data);
  if (!result.ok) return createProblem(result.reason);

  return Response.json(result.data, { status: 201 });
}
