"use client";

import { useMemo } from "react";
import type { EventDTO, CountryDTO } from "@/lib/repos";
import type { QuakeMarker } from "@/lib/liveQuakes";
import type { FlightMarker } from "@/lib/liveFlights";
import { ago } from "@/lib/client";

// Small floating card for the empty map space (bottom-right) — a compact
// glance at real totals, not a placeholder. Every number here is derived
// from the same data already driving the feed/map/stats bar.
export function MapSummaryWidget({
  events,
  countries,
  quakes,
  flights,
}: {
  events: EventDTO[];
  countries: CountryDTO[];
  quakes: QuakeMarker[];
  flights: FlightMarker[];
}) {
  const summary = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    const latest = published.reduce<EventDTO | null>(
      (acc, e) => (!acc || e.timestamp > acc.timestamp ? e : acc),
      null,
    );
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      liveSignals: quakes.length + flights.length,
      latestUpdateAt: latest?.timestamp ?? null,
    };
  }, [events, countries, quakes, flights]);

  return (
    <div
      style={{
        position: "absolute", bottom: 16, right: 16, zIndex: 22,
        background: "var(--panel)", backdropFilter: "blur(12px)",
        border: "1px solid var(--stroke)", borderRadius: "var(--radius)",
        boxShadow: "var(--shadow)", padding: "12px 15px", width: 190,
        fontSize: 12.5, color: "var(--text)",
      }}
    >
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
        Today's summary
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>Monitored</span>
          <span className="mono">{summary.countriesMonitored}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>Emergencies</span>
          <span className="mono">{summary.activeEmergencies}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted)" }}>Live signals</span>
          <span className="mono">{summary.liveSignals}</span>
        </div>
      </div>
      {summary.latestUpdateAt && (
        <div style={{ marginTop: 9, paddingTop: 8, borderTop: "1px solid var(--stroke)", fontSize: 11, color: "var(--faint)" }}>
          Latest update {ago(summary.latestUpdateAt)}
        </div>
      )}
    </div>
  );
}
