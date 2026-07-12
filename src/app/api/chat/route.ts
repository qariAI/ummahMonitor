import { listEvents } from "@/lib/repos";
import { answerChat, RateLimitError, type ChatTurn } from "@/lib/chat";
import { requireUser, AuthError } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

const WINDOW_MS = 168 * 3600_000; // same 7-day window as the briefing system

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return fail("Sign in to use AI Chat", 401);
    throw e;
  }

  const body = await readJson<{ question: string; history?: ChatTurn[] }>(req);
  if (!body?.question || !body.question.trim()) return fail("Missing question");

  const events = await listEvents({ publicOnly: true, sinceMs: Date.now() - WINDOW_MS });

  try {
    const result = await answerChat(user.id, body.question.trim(), body.history ?? [], events);
    return ok(result);
  } catch (e) {
    if (e instanceof RateLimitError) return fail(e.message, 429);
    return fail("Failed to generate a response", 502);
  }
}
