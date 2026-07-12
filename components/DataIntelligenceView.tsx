"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "./Nav";
import { KpiCard } from "./viz/KpiCard";
import { BubbleChart } from "./viz/BubbleChart";
import { Treemap } from "./viz/Treemap";
import { EventTimeline } from "./viz/EventTimeline";
import { ConfidenceAnalytics } from "./viz/ConfidenceAnalytics";
import { CountryComparison } from "./viz/CountryComparison";
import { CATEGORIES, api, type CategoryKey } from "@/lib/client";
import type { CountryDTO, EventDTO } from "@/lib/repos";

const RANGES = ["24h", "7d", "30d", "all"] as const;
type Range = (typeof RANGES)[number];

export function DataIntelligenceView({
  initialEvents,
  countries,
}: {
  initialEvents: EventDTO[];
  countries: CountryDTO[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [range, setRange] = useState<Range>("all");
  const [activeCats, setActiveCats] = useState<Record<CategoryKey, boolean>>(
    Object.fromEntries((Object.keys(CATEGORIES) as CategoryKey[]).map((k) => [k, true])) as Record<CategoryKey, boolean>,
  );
  const [countryFilter, setCountryFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    api<{ events: EventDTO[] }>(`/api/events?range=${range}`)
      .then((r) => alive && setEvents(r.events))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [range]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) => activeCats[e.category as CategoryKey] && (countryFilter === "all" || e.country === countryFilter),
      ),
    [events, activeCats, countryFilter],
  );

  const filteredCountries = countryFilter === "all" ? countries : countries.filter((c) => c.name === countryFilter);

  const kpis = useMemo(() => {
    const published = filtered.filter((e) => e.trust.status !== "withheld");
    return {
      total: published.length,
      emergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      humanitarian: published.filter((e) => e.category === "humanitarian").length,
      goodNews: published.filter((e) => e.category === "good_news").length,
      countries: new Set(published.map((e) => e.country)).size,
    };
  }, [filtered]);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Data Intelligence</div>
          <h1>Visual analytics</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, maxWidth: 640 }}>
            Every chart below is built from the same live, verified event and country data as the map — filter once,
            see it reflected everywhere.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 22 }}>
          <div className="range-ctl" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            style={{ background: "var(--bg2)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", fontSize: 12.5 }}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCats((prev) => ({ ...prev, [c]: !prev[c] }))}
                className="chip"
                style={{
                  opacity: activeCats[c] ? 1 : 0.4,
                  borderColor: activeCats[c] ? "var(--stroke2)" : "var(--stroke)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <span className="cdot" style={{ background: `var(${CATEGORIES[c].token})` }} />
                {CATEGORIES[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="kpi-row">
          <KpiCard icon="📡" value={kpis.total} label="events tracked" />
          <KpiCard icon="🚨" value={kpis.emergencies} label="active emergencies" />
          <KpiCard icon="❤️" value={kpis.humanitarian} label="humanitarian responses" />
          <KpiCard icon="✨" value={kpis.goodNews} label="good news stories" />
          <KpiCard icon="🌍" value={kpis.countries} label="countries active" />
        </div>

        <div className="viz-grid">
          <BubbleChart countries={filteredCountries.length ? filteredCountries : countries} events={filtered} onSelectCountry={(name) => router.push(`/country/${encodeURIComponent(name)}`)} />
          <Treemap events={filtered} onSelectCountry={(name) => router.push(`/country/${encodeURIComponent(name)}`)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <EventTimeline events={filtered} onSelectEvent={(id) => router.push(`/?event=${id}`)} />
        </div>

        <div className="viz-grid" style={{ marginTop: 16 }}>
          <ConfidenceAnalytics events={filtered} />
          <CountryComparison countries={countries} events={filtered} />
        </div>

        <p style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 18 }}>
          Source: UmmahMonitor verified event feed. Withheld/unverified reports excluded. Updated live.
        </p>
      </div>
    </>
  );
}
