import { NextRequest } from "next/server";
import { listModeration } from "@/lib/repos";
import { requireModerator, AuthError } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import type { Category } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireModerator();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 403);
    throw e;
  }
  const sp = req.nextUrl.searchParams;
  const status = (sp.get("status") as any) || undefined;
  const category = (sp.get("category") as Category) || undefined;
  const sort = (sp.get("sort") as any) || "recent";
  const { items, counts } = await listModeration({ status, category, sort });
  return ok({ items, counts });
}
