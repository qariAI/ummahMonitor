"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { EventDTO, CountryDTO } from "@/lib/repos";

const EXPLORE_LINKS = [
  { href: "/chat", icon: "💬", label: "Chat" },
  { href: "/broadcast", icon: "📺", label: "Broadcast" },
  { href: "/data", icon: "📊", label: "Data" },
  { href: "/stories", icon: "📖", label: "Stories" },
];

// Deliberately minimal — one row, three real stats, explore links folded
// into the same bar instead of a separate one. Dropped the Hajj/Eid
// countdown and "Updated" timestamp that lived here before; still real data,
// just moved out to reduce how much competes for attention up top.
export function StatsBar({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const stats = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    const avgConfidence = published.length
      ? Math.round(published.reduce((s, e) => s + e.trust.confidence, 0) / published.length)
      : 0;
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      liveSignals: published.length,
      avgConfidence,
    };
  }, [events, countries]);

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-icon">🌍</span>
        <span className="stat-num">{stats.countriesMonitored}</span>
        <span className="stat-lbl">countries</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🚨</span>
        <span className="stat-num">{stats.activeEmergencies}</span>
        <span className="stat-lbl">emergencies</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">📡</span>
        <span className="stat-num">{stats.liveSignals}</span>
        <span className="stat-lbl">live signals</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">✓</span>
        <span className="stat-num">{stats.avgConfidence}%</span>
        <span className="stat-lbl">avg. confidence</span>
      </div>
      <div className="stat-card-divider" style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
        {EXPLORE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="explore-link">
            <span>{l.icon}</span> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
