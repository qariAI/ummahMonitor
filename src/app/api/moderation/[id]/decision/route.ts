import { decideModeration } from "@/lib/repos";
import { requireModerator, AuthError } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireModerator();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 403);
    throw e;
  }
  const { id } = await params;
  const body = await readJson<{ decision: "approved" | "rejected" | "flagged" }>(req);
  if (!body || !["approved", "rejected", "flagged"].includes(body.decision))
    return fail("Invalid decision");
  const item = await decideModeration(Number(id), body.decision, user.email);
  if (!item) return fail("Item not found", 404);
  return ok({ item });
}
