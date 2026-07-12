import { NextRequest } from "next/server";
import { listEvents } from "@/lib/repos";
import { ok } from "@/lib/http";
import type { Category } from "@/lib/types";

const RANGES: Record<string, number> = { "24h": 864e5, "7d": 7 * 864e5, "30d": 30 * 864e5 };

// Public event feed. Defaults to publishable-only (withheld/pending excluded).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const range = sp.get("range") ?? "all";
  const category = (sp.get("category") as Category) || undefined;
  const includeWithheld = sp.get("includeWithheld") === "1";
  const sinceMs = RANGES[range] ? Date.now() - RANGES[range] : undefined;
  const events = await listEvents({ publicOnly: !includeWithheld, category, sinceMs });
  return ok({ events, threshold: events[0]?.trust.threshold ?? 70 });
}
