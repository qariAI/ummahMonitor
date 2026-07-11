import { listSavedEvents, listSavedEventIds, saveEvent, unsaveEvent } from "@/lib/repos";
import { requireUser, AuthError } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const eventIdParam = req.nextUrl.searchParams.get("eventId");
    // Lightweight path for the per-event bookmark button — avoids fetching
    // and hydrating every saved event just to render one toggle icon.
    if (eventIdParam) {
      const ids = await listSavedEventIds(user.id);
      return ok({ saved: ids.includes(Number(eventIdParam)) });
    }
    const events = await listSavedEvents(user.id);
    return ok({ events });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ eventId: number }>(req);
    if (!body?.eventId) return fail("Missing eventId");
    await saveEvent(user.id, Number(body.eventId));
    return ok({ saved: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ eventId: number }>(req);
    if (!body?.eventId) return fail("Missing eventId");
    await unsaveEvent(user.id, Number(body.eventId));
    return ok({ saved: false });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, 401);
    throw e;
  }
}
