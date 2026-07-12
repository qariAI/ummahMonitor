import { getModerationItem } from "@/lib/repos";
import { getSessionUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("Authentication required", 401);
  const { id } = await params;
  const item = await getModerationItem(Number(id));
  if (!item) return fail("Item not found", 404);
  return ok({ item });
}
