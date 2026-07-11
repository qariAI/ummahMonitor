import { NextRequest } from "next/server";
import { listEvents } from "@/lib/repos";
import { getBriefing } from "@/lib/briefing";
import { ok, fail } from "@/lib/http";

const WINDOW_MS = 168 * 3600_000; // 7 days — briefings look a bit further back than the Context panel's 72h

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") || "global";

  const recent = await listEvents({ publicOnly: true, sinceMs: Date.now() - WINDOW_MS });
  const events = scope === "global" ? recent : recent.filter((e) => e.country === scope);

  try {
    const briefing = await getBriefing(scope, events);
    return ok(briefing);
  } catch {
    return fail("Failed to generate briefing", 502);
  }
}
