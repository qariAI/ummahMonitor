import { prisma } from "@/lib/db";
import { hashPassword, createSession, toSessionUser } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<{ email: string; password: string; name: string }>(req);
  if (!body?.email || !body?.password || !body?.name) return fail("Missing fields");
  if (body.password.length < 8) return fail("Password must be at least 8 characters");
  const email = body.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("An account with this email already exists", 409);
  const user = await prisma.user.create({
    data: { email, name: body.name.trim(), passwordHash: await hashPassword(body.password) },
  });
  await createSession(user.id);
  return ok({ user: toSessionUser(user) }, { status: 201 });
}
