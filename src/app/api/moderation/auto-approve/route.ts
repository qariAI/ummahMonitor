import { autoApproveVerified } from "@/lib/repos";
import { requireModerator, AuthError } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function POST() {
  let user;
  try {
    user = await requireModerator();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 403);
    throw e;
  }
  const approved = await autoApproveVerified(user.email);
  return ok({ approved });
}
