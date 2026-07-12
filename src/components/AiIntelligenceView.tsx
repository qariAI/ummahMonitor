"use client";

import Link from "next/link";
import { Nav } from "./Nav";
import { scoreColorToken } from "@/lib/client";
import { AiDetectionFeed, FeaturedCountryAnalysis } from "./IntelligencePanels";
import type { CountryDTO, EventDTO } from "@/lib/repos";

// "Escalating" / "improving" here means exactly one real thing: the
// country's own seeded trend field (up/down/flat), sorted by current
// Situation Index. No forecasting, no invented percentages — see the
// standing rule against presenting unfounded predictions as fact.
export function AiIntelligenceView({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const escalating = countries.filter((c) => c.trend === "up").sort((a, b) => b.score - a.score).slice(0, 5);
  const improving = countries.filter((c) => c.trend === "down").sort((a, b) => a.score - b.score).slice(0, 5);

  const published = events.filter((e) => e.trust.status !== "withheld");
  const emergencyCountries = new Set(published.filter((e) => e.severity === "critical" || e.severity === "high").map((e) => e.country));
  const attention = countries.filter((c) => emergencyCountries.has(c.name)).sort((a, b) => b.score - a.score);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">AI Intelligence</div>
          <h1>Insight engine</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, maxWidth: 640 }}>
            Real rankings from the platform's own tracked Situation Index and trend data — not forecasts. For
            conversational analysis, use <Link href="/chat" style={{ color: "var(--faith)" }}>AI Chat</Link>; for a
            narrated daily briefing, use <Link href="/broadcast" style={{ color: "var(--faith)" }}>AI Broadcast</Link>.
          </p>
        </div>

        <div className="ip-grid-2" style={{ marginBottom: 16 }}>
          <div className="ip-panel">
            <div className="ip-hd">📈 TOP ESCALATING SITUATIONS</div>
            <ul className="ip-list">
              {escalating.map((c) => (
                <li key={c.name}>
                  <Link href={`/country/${encodeURIComponent(c.name)}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
                    <span className="ip-org-name">{c.flag} {c.name}</span>
                    <span style={{ fontFamily: "var(--mono)", color: `var(${scoreColorToken(c.score)})` }}>{c.score} ▲</span>
                  </Link>
                </li>
              ))}
              {escalating.length === 0 && <li className="ip-org-note">No countries currently trending up.</li>}
            </ul>
          </div>
          <div className="ip-panel">
            <div className="ip-hd">📉 TOP IMPROVING SITUATIONS</div>
            <ul className="ip-list">
              {improving.map((c) => (
                <li key={c.name}>
                  <Link href={`/country/${encodeURIComponent(c.name)}`} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
                    <span className="ip-org-name">{c.flag} {c.name}</span>
                    <span style={{ fontFamily: "var(--mono)", color: `var(${scoreColorToken(c.score)})` }}>{c.score} ▼</span>
                  </Link>
                </li>
              ))}
              {improving.length === 0 && <li className="ip-org-note">No countries currently trending down.</li>}
            </ul>
          </div>
        </div>

        <div className="ip-panel" style={{ marginBottom: 16 }}>
          <div className="ip-hd">⚠️ REGIONS REQUIRING HUMANITARIAN ATTENTION</div>
          <p className="ip-sub">Countries with at least one active critical/high-severity development right now.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {attention.map((c) => (
              <Link key={c.name} href={`/country/${encodeURIComponent(c.name)}`} className="chip" style={{ textDecoration: "none" }}>
                {c.flag} {c.name} · {c.score}
              </Link>
            ))}
            {attention.length === 0 && <p className="ip-org-note">No active critical/high-severity developments.</p>}
          </div>
        </div>

        <div className="ip-grid-2">
          <AiDetectionFeed events={events} countries={countries} />
          <FeaturedCountryAnalysis countries={countries} />
        </div>
      </div>
    </>
  );
}
