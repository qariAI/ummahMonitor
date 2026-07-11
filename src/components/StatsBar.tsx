"use client";

import { useMemo } from "react";
import type { EventDTO, CountryDTO } from "@/lib/repos";

// Three plain, non-scrolling stat cards — deliberately simpler than a
// scrolling ticker. Scrolling news stays in its own dedicated <Ticker>;
// this bar is just glanceable numbers, not competing for attention.
// All three counts are derived from the same live event/country data shown
// on the map, never placeholder numbers.
export function StatsBar({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const stats = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      humanitarianResponses: published.filter((e) => e.category === "humanitarian").length,
    };
  }, [events, countries]);

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-icon">🌍</span>
        <span className="stat-num">{stats.countriesMonitored}</span>
        <span className="stat-lbl">countries monitored</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🚨</span>
        <span className="stat-num">{stats.activeEmergencies}</span>
        <span className="stat-lbl">active emergencies</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">❤️</span>
        <span className="stat-num">{stats.humanitarianResponses}</span>
        <span className="stat-lbl">humanitarian responses</span>
      </div>
    </div>
  );
}
