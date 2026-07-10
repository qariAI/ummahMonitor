import { prisma } from "@/lib/db";
import { verifyPassword, createSession, toSessionUser } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<{ email: string; password: string }>(req);
  if (!body?.email || !body?.password) return fail("Missing email/password");
  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish response regardless of which factor failed.
  if (!user || !(await verifyPassword(body.password, user.passwordHash)))
    return fail("Invalid email or password", 401);
  await createSession(user.id);
  return ok({ user: toSessionUser(user) });
}
