import { db } from "@/db";
import { listCategories } from "@/features/categories/server/categories-repo";
import { unauthorized } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/session";

/** GET /api/categories: the signed-in user's categories, for the form. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await listCategories(db, user.id));
}
