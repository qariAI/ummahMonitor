"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { CATEGORIES, type CategoryKey } from "@/lib/client";
import { SOURCE_DIRECTORY, TIER_META } from "@/lib/confidence";
import type { Tier } from "@/lib/types";
import { CountryBriefing } from "./CountryBriefing";

// ── AI Broadcast preview ─────────────────────────────────────────────────
function BroadcastPreview() {
  const [headline, setHeadline] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/briefing?scope=global")
      .then((r) => r.json())
      .then((r) => setHeadline(r?.data?.bullets?.[0] ?? null))
      .catch(() => {});
  }, []);
  return (
    <div className="ip-panel">
      <div className="ip-hd">
        <span className="live-dot" /> AI BROADCAST
      </div>
      <p className="ip-broadcast-line">{headline ?? "Loading today's briefing…"}</p>
      <Link href="/broadcast" className="pill-btn" style={{ display: "inline-flex", marginTop: 10 }}>
        ▶ Open Broadcast Studio
      </Link>
    </div>
  );
}

// ── Humanitarian panel — real responder orgs pulled from event data ──────
function HumanitarianPanel({ events }: { events: EventDTO[] }) {
  const humanitarian = events.filter((e) => e.category === "humanitarian" && e.trust.status !== "withheld");
  const orgMap = new Map<string, { note: string; country: string }>();
  for (const e of humanitarian) {
    for (const r of e.response?.responders ?? []) {
      if (!orgMap.has(r.name)) orgMap.set(r.name, { note: r.note, country: e.country });
    }
  }
  const orgs = Array.from(orgMap.entries()).slice(0, 5);

  return (
    <div className="ip-panel">
      <div className="ip-hd">❤️ HUMANITARIAN</div>
      <p className="ip-sub">{humanitarian.length} active humanitarian events · {orgMap.size} organisations responding</p>
      <ul className="ip-list">
        {orgs.map(([name, info]) => (
          <li key={name}>
            <span className="ip-org-name">{name}</span>
            <span className="ip-org-note">{info.note} — {info.country}</span>
          </li>
        ))}
      </ul>
      {orgs.length === 0 && <p className="ip-sub">No active responders in range.</p>}
    </div>
  );
}

// ── Data Visualisation preview — real category breakdown ─────────────────
function DataVizPreview({ events }: { events: EventDTO[] }) {
  const published = events.filter((e) => e.trust.status !== "withheld");
  const counts = new Map<CategoryKey, number>();
  for (const e of published) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  const max = Math.max(1, ...Array.from(counts.values()));
  const rows = (Object.keys(CATEGORIES) as CategoryKey[])
    .map((c) => ({ c, n: counts.get(c) ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <div className="ip-panel">
      <div className="ip-hd">📊 DATA VISUALISATION</div>
      <div className="ip-bars">
        {rows.map(({ c, n }) => (
          <div key={c} className="ip-bar-row">
            <span className="ip-bar-lbl">{CATEGORIES[c].label}</span>
            <div className="ip-bar-track">
              <div className="ip-bar-fill" style={{ width: `${(n / max) * 100}%`, background: `var(${CATEGORIES[c].token})` }} />
            </div>
            <span className="ip-bar-num">{n}</span>
          </div>
        ))}
      </div>
      <Link href="/data" className="viz-source-link">Full Data Intelligence →</Link>
    </div>
  );
}

// ── Verified Sources — real source directory, grouped by tier ────────────
function VerifiedSourcesPanel() {
  const byTier = new Map<Tier, string[]>();
  for (const [name, tier] of Object.entries(SOURCE_DIRECTORY)) {
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(name);
  }
  const tierOrder: Tier[] = ["official", "wire", "relief", "regional", "community"];

  return (
    <div className="ip-panel">
      <div className="ip-hd">✓ VERIFIED SOURCES</div>
      <p className="ip-sub">{Object.keys(SOURCE_DIRECTORY).length} sources across {byTier.size} tiers</p>
      <div className="ip-source-tiers">
        {tierOrder.filter((t) => byTier.has(t)).map((t) => (
          <div key={t} className="ip-source-tier">
            <span className="ip-source-tier-label" style={{ color: `var(${TIER_META[t].token})` }}>{TIER_META[t].label}</span>
            <span className="ip-source-names">{byTier.get(t)!.slice(0, 4).join(" · ")}{byTier.get(t)!.length > 4 ? ` +${byTier.get(t)!.length - 4}` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Featured Country AI Situation Analysis — reuses the real CountryBriefing ──
function FeaturedCountryAnalysis({ countries }: { countries: CountryDTO[] }) {
  const top = [...countries].sort((a, b) => b.score - a.score)[0];
  if (!top) return null;
  return (
    <div className="ip-panel ip-panel-wide">
      <div className="ip-hd">
        🤖 AI SITUATION ANALYSIS
        <Link href={`/country/${encodeURIComponent(top.name)}`} className="viz-source-link" style={{ marginLeft: "auto" }}>
          {top.flag} {top.name} · Index {top.score} → Full profile
        </Link>
      </div>
      <CountryBriefing country={top.name} />
    </div>
  );
}

// ── AI Detection feed — real, computed observations, never invented trend
// deltas (no historical time-series exists yet to honestly compute "dropped
// 12%" style claims — see standing rule against fabricating data). ─────────
function AiDetectionFeed({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const published = events.filter((e) => e.trust.status !== "withheld");

  const byCountryHumanitarian = new Map<string, number>();
  for (const e of published) {
    if (e.category === "humanitarian") byCountryHumanitarian.set(e.country, (byCountryHumanitarian.get(e.country) ?? 0) + 1);
  }
  const topHumanitarian = Array.from(byCountryHumanitarian.entries()).sort((a, b) => b[1] - a[1])[0];

  const goodNewsCount = published.filter((e) => e.category === "good_news").length;
  const countriesWithEmergency = new Set(published.filter((e) => e.severity === "critical" || e.severity === "high").map((e) => e.country));
  const calmCountries = countries.filter((c) => !countriesWithEmergency.has(c.name)).length;
  const highConfidenceCount = published.filter((e) => e.trust.confidence >= 85).length;

  const observations = [
    topHumanitarian && `${topHumanitarian[1]} humanitarian ${topHumanitarian[1] === 1 ? "event" : "events"} tracked in ${topHumanitarian[0]} right now.`,
    goodNewsCount > 0 && `${goodNewsCount} good news ${goodNewsCount === 1 ? "story" : "stories"} verified today.`,
    `${calmCountries} of ${countries.length} monitored countries currently have no active emergency.`,
    highConfidenceCount > 0 && `${highConfidenceCount} ${highConfidenceCount === 1 ? "development is" : "developments are"} at 85%+ confidence.`,
  ].filter((x): x is string => typeof x === "string");

  if (observations.length === 0) return null;

  return (
    <div className="ip-panel">
      <div className="ip-hd">🧠 AI DETECTED</div>
      <ul className="ip-list">
        {observations.map((o, i) => (
          <li key={i}><span className="ip-org-note">{o}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function IntelligencePanels({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  return (
    <div className="ip-section">
      <div className="ip-grid-3">
        <HumanitarianPanel events={events} />
        <DataVizPreview events={events} />
        <VerifiedSourcesPanel />
      </div>
      <div className="ip-grid-2">
        <AiDetectionFeed events={events} countries={countries} />
        <BroadcastPreview />
      </div>
      <div className="ip-grid-2">
        <FeaturedCountryAnalysis countries={countries} />
      </div>
    </div>
  );
}
