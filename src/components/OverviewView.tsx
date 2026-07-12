"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { CATEGORIES, ago, scoreColorToken, type CategoryKey } from "@/lib/client";
import { TIER_META } from "@/lib/confidence";
import { STORIES } from "@/lib/stories";
import type { CountryDTO, EventDTO } from "@/lib/repos";

// Single-viewport "launcher" home screen — 12 tiles, no scroll on a normal
// desktop display, each tile a compact real-data summary linking to its
// full workspace. Deliberately excludes live cameras (no licensing) and a
// calendar tile (removed per instruction) — swapped for Data Stories and
// Trust Analytics instead, both real and already built. Every number here
// is computed from the same live event/country data as the rest of the app.
function Tile({ n, href, icon, title, sub, children }: { n: number; href: string; icon: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="ov-tile">
      <div className="ov-tile-hd">
        <span className="ov-tile-icon">{icon}</span>
        <div>
          <div className="ov-tile-title"><span className="ov-tile-num">{n}.</span> {title}</div>
          <div className="ov-tile-sub">{sub}</div>
        </div>
      </div>
      <div className="ov-tile-body">{children}</div>
    </Link>
  );
}

export function OverviewView({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/briefing?scope=global")
      .then((r) => r.json())
      .then((r) => setHeadline(r?.data?.bullets?.[0] ?? null))
      .catch(() => {});
  }, []);

  const published = events.filter((e) => e.trust.status !== "withheld");
  const activeEmergencies = published.filter((e) => e.severity === "critical" || e.severity === "high").length;

  const escalating = [...countries].filter((c) => c.trend === "up").sort((a, b) => b.score - a.score)[0];
  const topRanked = [...countries].sort((a, b) => b.score - a.score).slice(0, 3);

  const orgMap = new Map<string, string>();
  for (const e of published.filter((e) => e.category === "humanitarian")) {
    for (const r of e.response?.responders ?? []) orgMap.set(r.name, e.country);
  }
  const topOrgs = Array.from(orgMap.keys()).slice(0, 3);

  const catCounts = new Map<CategoryKey, number>();
  for (const e of published) catCounts.set(e.category, (catCounts.get(e.category) ?? 0) + 1);
  const topCats = (Object.keys(CATEGORIES) as CategoryKey[])
    .map((c) => ({ c, n: catCounts.get(c) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);

  const avgConfidence = published.length ? Math.round(published.reduce((s, e) => s + e.trust.confidence, 0) / published.length) : 0;
  const tierCounts = new Map<string, number>();
  let totalSources = 0;
  for (const e of published) for (const s of e.trust.sources) { tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1); totalSources++; }
  const topTier = Array.from(tierCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  const publishedStories = STORIES.filter((s) => s.status === "published");
  const latestEvents = published.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

  return (
    <>
      <Nav />
      <div className="ov-grid">
        <Tile n={1} href="/" icon="🌍" title="Live Map" sub="Real-time overview">
          <div className="bento-map-preview">
            {published.slice(0, 24).map((e) => (
              <span
                key={e.id}
                className="bento-map-dot"
                style={{
                  left: `${((e.lon + 180) / 360) * 100}%`,
                  top: `${((90 - e.lat) / 180) * 100}%`,
                  background: `var(${CATEGORIES[e.category].token})`,
                }}
              />
            ))}
          </div>
          <div className="ov-stat">{countries.length} <span>countries</span></div>
          <div className="ov-stat-alt">{activeEmergencies} active emergencies</div>
        </Tile>

        <Tile n={2} href="/broadcast" icon="🎙" title="AI Broadcast" sub="Your AI news briefing">
          <p className="ov-line">{headline ?? "Loading today's briefing…"}</p>
        </Tile>

        <Tile n={3} href="/holy-sites" icon="🕋" title="Holy Sites Live" sub="Sacred places, verified">
          <div className="ov-line">Masjid al-Haram · an-Nabawi · Al-Aqsa</div>
        </Tile>

        <Tile n={4} href="/ai-intelligence" icon="🧠" title="AI Intelligence" sub="Insight engine">
          {escalating ? (
            <div className="ov-stat" style={{ color: `var(${scoreColorToken(escalating.score)})` }}>
              {escalating.flag} {escalating.name} ▲ <span>{escalating.score}</span>
            </div>
          ) : <div className="ov-line">No escalating situations</div>}
        </Tile>

        <Tile n={5} href="/chat" icon="💬" title="AI Copilot" sub="Ask the Ummah database">
          <div className="ov-line">"What's happening in Gaza today?"</div>
        </Tile>

        <Tile n={6} href="/" icon="⏳" title="Timeline Replay" sub="Watch history unfold">
          <div className="ov-stat">{published.length} <span>real events, replayable</span></div>
        </Tile>

        <Tile n={7} href="/humanitarian" icon="🤲" title="Humanitarian" sub="For NGOs, for impact">
          <div className="ov-stat">{orgMap.size} <span>organisations active</span></div>
          <div className="ov-stat-alt">{topOrgs.join(" · ") || "None active"}</div>
        </Tile>

        <Tile n={8} href="/data" icon="📊" title="Data & Statistics" sub="Visualise. Compare.">
          {topCats.map(({ c, n }) => (
            <span key={c} className="ov-chip" style={{ color: `var(${CATEGORIES[c].token})` }}>{CATEGORIES[c].label} {n}</span>
          ))}
        </Tile>

        <Tile n={9} href="/stories" icon="📖" title="Data Stories" sub="Sourced visual narratives">
          <div className="ov-stat">{publishedStories.length} <span>published {publishedStories.length === 1 ? "story" : "stories"}</span></div>
          <div className="ov-stat-alt">{publishedStories[0]?.title ?? "—"}</div>
        </Tile>

        <Tile n={10} href="/data" icon="✓" title="Trust & Verification" sub="Why you can rely on this">
          <div className="ov-stat">{avgConfidence}% <span>avg. confidence</span></div>
          {topTier && <div className="ov-stat-alt">Mostly {TIER_META[topTier[0] as keyof typeof TIER_META]?.label ?? topTier[0]} sources</div>}
        </Tile>

        <Tile n={11} href="/ai-intelligence" icon="📈" title="Situation Index" sub="Ranked by score">
          {topRanked.map((c, i) => (
            <div key={c.name} className="ov-rank"><span>{i + 1}. {c.flag} {c.name}</span><span style={{ color: `var(${scoreColorToken(c.score)})` }}>{c.score}</span></div>
          ))}
        </Tile>

        <Tile n={12} href="/" icon="📡" title="World Pulse" sub="Every second, everywhere">
          {latestEvents.map((e) => (
            <div key={e.id} className="ov-line" style={{ fontSize: 10.5 }}>{e.country} · {ago(e.timestamp)}</div>
          ))}
        </Tile>
      </div>
    </>
  );
}
