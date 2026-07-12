import { getFollowedCountries, followCountry, unfollowCountry } from "@/lib/repos";
import { requireUser, AuthError } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const countries = await getFollowedCountries(user.id);
    return ok({ countries });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ country: string }>(req);
    if (!body?.country) return fail("Missing country");
    const countries = await followCountry(user.id, body.country);
    return ok({ countries });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ country: string }>(req);
    if (!body?.country) return fail("Missing country");
    const countries = await unfollowCountry(user.id, body.country);
    return ok({ countries });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}
