import { NextRequest } from "next/server";
import { listEvents } from "@/lib/repos";
import { getBriefing } from "@/lib/briefing";
import { ok, fail } from "@/lib/http";

const WINDOW_MS = 168 * 3600_000; // 7 days — briefings look a bit further back than the Context panel's 72h

// No dedicated "climate" event category exists yet (see original category
// audit) — this is a best-effort keyword filter over humanitarian/conflict/
// economy events, not a verified taxonomy. Flagged as such in the UI too.
const CLIMATE_KEYWORDS = ["flood", "drought", "heat", "climate", "wildfire", "storm", "cyclone", "crop", "famine", "water scarcity", "desertif"];

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") || "global";

  const recent = await listEvents({ publicOnly: true, sinceMs: Date.now() - WINDOW_MS });

  let events = recent;
  if (scope.startsWith("category:")) {
    const cat = scope.slice("category:".length);
    events = recent.filter((e) => e.category === cat);
  } else if (scope === "climate") {
    events = recent.filter((e) => {
      const text = `${e.title} ${e.what}`.toLowerCase();
      return CLIMATE_KEYWORDS.some((k) => text.includes(k));
    });
  } else if (scope !== "global") {
    events = recent.filter((e) => e.country === scope);
  }

  try {
    const briefing = await getBriefing(scope, events);
    return ok(briefing);
  } catch {
    return fail("Failed to generate briefing", 502);
  }
}
