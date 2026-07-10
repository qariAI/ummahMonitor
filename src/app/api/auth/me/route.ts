import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  return ok({ user });
}
