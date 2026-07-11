"use client";

import { useEffect, useState } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { CATEGORIES, ago, scoreColorToken } from "@/lib/client";
import { CORRIDORS } from "./WorldMap";

const TREND_GLYPH: Record<string, string> = { up: "▲", down: "▼", flat: "─" };
const SEV_WEIGHT: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };


const STATUS_LABEL: Record<string, string> = { active: "active", strained: "strained", closed: "closed" };

// Right-side "Signals" rail: Situation Index (real country scores),
// Crisis Tracker (real events, filtered to humanitarian/high-severity
// conflict), and Aid Corridors. Corridors are illustrative/hardcoded — no
// real schema exists for them yet (see design handoff README).
export function SignalsRail({
  countries,
  events,
  onSelectCountry,
  onSelectEvent,
}: {
  countries: CountryDTO[];
  events: EventDTO[];
  onSelectCountry: (country: CountryDTO) => void;
  onSelectEvent: (id: number) => void;
}) {
  const topCountries = [...countries].sort((a, b) => b.score - a.score).slice(0, 8);
  const crises = events
    .filter((e) => e.category === "humanitarian" || (e.category === "conflict" && (e.severity === "critical" || e.severity === "high")))
    .sort((a, b) => (SEV_WEIGHT[b.severity] ?? 0) - (SEV_WEIGHT[a.severity] ?? 0))
    .slice(0, 8);

  // Cycle the spotlight through distinct crisis-affected countries every 4s —
  // keeps the panel feeling alive without needing new data. Purely a rotating
  // view of the same real crises listed below, not separate content.
  const spotlightCountries = Array.from(new Set(crises.map((e) => e.country)));
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  useEffect(() => {
    if (spotlightCountries.length < 2) return;
    const id = setInterval(() => setSpotlightIdx((i) => (i + 1) % spotlightCountries.length), 4000);
    return () => clearInterval(id);
  }, [spotlightCountries.length]);
  const spotlightCountry = spotlightCountries[spotlightIdx % spotlightCountries.length];
  const spotlightCrisis = crises.find((e) => e.country === spotlightCountry);

  return (
    <aside className="rail signals-rail">
      <div className="rail-hd">
        <h2>Signals</h2>
        <span className="count">{countries.length + crises.length + CORRIDORS.length} tracked</span>
      </div>

      <div className="pnl">
        <div className="pnl-hd">
          <h3 title="Composite of Safety, Humanitarian, Worship &amp; Economy indicators (0–100, higher = more severe)">Situation Index</h3>
          <span className="tag">{countries.length} countries</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--faint)", margin: "-4px 0 10px", lineHeight: 1.4 }}>
          Composite score (0–100) from conflict, humanitarian need, disaster impact &amp; verified developments.
        </p>
        {topCountries.map((c) => (
          <button key={c.name} className="idx" onClick={() => onSelectCountry(c)}>
            <span className="sd" style={{ background: `var(${scoreColorToken(c.score)})` }} />
            <span className="cn">{c.code}</span>
            <span className="bar"><i style={{ width: `${c.score}%`, background: `var(${scoreColorToken(c.score)})` }} /></span>
            <span className="sc">{c.score}</span>
            <span className={`tr ${c.trend}`}>{TREND_GLYPH[c.trend] ?? "─"}</span>
          </button>
        ))}
      </div>

      <div className="pnl">
        <div className="pnl-hd">
          <h3>Crisis Tracker</h3>
          <span className="tag">{crises.length} active</span>
        </div>
        {spotlightCrisis && (
          <button
            key={spotlightCountry}
            className="cri"
            onClick={() => onSelectEvent(spotlightCrisis.id)}
            style={{ background: "color-mix(in srgb, var(--conflict) 7%, transparent)", borderRadius: 8, marginBottom: 8, animation: "ev-in 0.4s ease" }}
          >
            <span className="sd" style={{ background: `var(${CATEGORIES[spotlightCrisis.category].token})` }} />
            <span className="cri-body">
              <span className="ct-t" style={{ fontWeight: 700 }}>{spotlightCountry}</span>
              <span className="ct-s">{spotlightCrisis.title}</span>
            </span>
          </button>
        )}
        {crises.map((e) => (
          <button key={e.id} className="cri" onClick={() => onSelectEvent(e.id)}>
            <span className="sd" style={{ background: `var(${CATEGORIES[e.category].token})` }} />
            <span className="cri-body">
              <span className="ct-t">{e.title}</span>
              <span className="ct-s">{e.country.toUpperCase()} · {e.severity.toUpperCase()} · {ago(e.timestamp)}</span>
            </span>
          </button>
        ))}
        {crises.length === 0 && <p className="empty-note">No active crises right now.</p>}
      </div>

      <div className="pnl">
        <div className="pnl-hd">
          <h3>Aid Corridors</h3>
          <span className="tag">{CORRIDORS.length} routes</span>
        </div>
        {CORRIDORS.map((c) => (
          <div key={c.label} className="cor">
            <span className="rt">
              <span className="rt-t">{c.label}</span>
              <span className="rt-s">{c.note}</span>
            </span>
            <span className={`st ${c.status}`}>{STATUS_LABEL[c.status]}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
