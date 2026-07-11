"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventDTO, CountryDTO } from "@/lib/repos";
import { getIslamicCalendarInfo } from "@/lib/hijri";
import { ago } from "@/lib/client";

// Three real stat cards plus two real Islamic-calendar countdowns — all in
// one static, non-scrolling row (deliberately not a second ticker, to avoid
// two competing scroll animations at the top of the page).
export function StatsBar({ events, countries, lastUpdatedAt }: { events: EventDTO[]; countries: CountryDTO[]; lastUpdatedAt: number }) {
  const stats = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      humanitarianResponses: published.filter((e) => e.category === "humanitarian").length,
    };
  }, [events, countries]);

  const hijri = useMemo(() => getIslamicCalendarInfo(), []);
  const hajjLabel = hijri.isHajjSeasonNow
    ? `Hajj · Dhul Hijjah ${hijri.hijriToday.day}`
    : hijri.daysUntilHajjDay === 0
      ? "Day of Arafah today"
      : `Hajj in ${hijri.daysUntilHajjDay} days`;
  const eidLabel = hijri.daysUntilEidAlFitr === 0 ? "Eid al-Fitr today" : `Eid al-Fitr in ${hijri.daysUntilEidAlFitr} days`;

  // Tick every 15s just to keep the "Updated X ago" text current — cheap,
  // local re-render only, no refetching.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

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
      <div className="stat-card stat-card-divider">
        <span className="stat-icon">🕋</span>
        <span className="stat-lbl">{hajjLabel}</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🌙</span>
        <span className="stat-lbl">{eidLabel}</span>
      </div>
      <div className="stat-card stat-card-divider" style={{ marginLeft: "auto" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--faith)", flex: "none" }} />
        <span className="stat-lbl">Updated {ago(lastUpdatedAt)}</span>
      </div>
    </div>
  );
}
