import { NextRequest } from "next/server";
import { listEvents, listCountries } from "@/lib/repos";
import { STORIES } from "@/lib/stories";
import { ok } from "@/lib/http";

export interface SearchResult {
  kind: "country" | "event" | "story";
  id: string;
  title: string;
  sub: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return ok({ results: [] as SearchResult[] });

  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);

  const results: SearchResult[] = [];

  for (const c of countries) {
    if (c.name.toLowerCase().includes(q)) {
      results.push({
        kind: "country",
        id: c.name,
        title: `${c.flag} ${c.name}`,
        sub: `Situation Index ${c.score}`,
        href: `/country/${encodeURIComponent(c.name)}`,
      });
    }
  }

  for (const e of events) {
    if (e.title.toLowerCase().includes(q) || e.country.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) {
      results.push({
        kind: "event",
        id: String(e.id),
        title: e.title,
        sub: `${e.country} · ${e.category}`,
        href: `/?event=${e.id}`,
      });
    }
  }

  for (const s of STORIES) {
    if (s.status !== "published") continue;
    if (s.title.toLowerCase().includes(q) || s.dek.toLowerCase().includes(q)) {
      results.push({
        kind: "story",
        id: s.slug,
        title: s.title,
        sub: "Data Story",
        href: `/stories/${s.slug}`,
      });
    }
  }

  return ok({ results: results.slice(0, 20) });
}
