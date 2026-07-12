import { prisma } from "@/lib/db";
import { requireUser, toSessionUser, AuthError, type OnboardingChannels } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

interface OnboardingBody {
  role: string | null;
  categories: string[];
  regions: string[];
  severity: string;
  digest: string;
  channels: OnboardingChannels;
}

const SEVERITIES = ["all", "medium", "high", "critical"];
const DIGESTS = ["real-time", "hourly", "daily", "weekly"];

export async function POST(req: Request) {
  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch (err) {
    if (err instanceof AuthError) return fail("Authentication required", 401);
    throw err;
  }

  const body = await readJson<OnboardingBody>(req);
  if (!body) return fail("Invalid body");
  if (!SEVERITIES.includes(body.severity)) return fail("Invalid severity");
  if (!DIGESTS.includes(body.digest)) return fail("Invalid digest frequency");

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      onboarded: true,
      role: body.role || null,
      categories: JSON.stringify(body.categories ?? []),
      regions: JSON.stringify(body.regions ?? []),
      severity: body.severity,
      digest: body.digest,
      channels: JSON.stringify(body.channels ?? { inapp: true, email: false, whatsapp: false }),
    },
  });
  return ok({ user: toSessionUser(user) });
}
