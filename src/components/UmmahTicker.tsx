"use client";

import { useMemo } from "react";
import type { EventDTO, CountryDTO } from "@/lib/repos";
import { getIslamicCalendarInfo } from "@/lib/hijri";

function ramadanLabel(info: ReturnType<typeof getIslamicCalendarInfo>): string {
  if (info.isRamadanNow) return `Ramadan · day ${info.hijriToday.day}`;
  if (info.daysUntilRamadan === 0) return "Ramadan begins today";
  return `Ramadan in ${info.daysUntilRamadan} days`;
}

function hajjLabel(info: ReturnType<typeof getIslamicCalendarInfo>): string {
  if (info.isHajjSeasonNow) return `Hajj · Dhul Hijjah ${info.hijriToday.day}`;
  if (info.daysUntilHajjDay === 0) return "Day of Arafah today";
  return `Hajj in ${info.daysUntilHajjDay} days`;
}

function eidAlFitrLabel(info: ReturnType<typeof getIslamicCalendarInfo>): string {
  if (info.daysUntilEidAlFitr === 0) return "Eid al-Fitr today";
  return `Eid al-Fitr in ${info.daysUntilEidAlFitr} days`;
}

function eidAlAdhaLabel(info: ReturnType<typeof getIslamicCalendarInfo>): string {
  if (info.daysUntilEidAlAdha === 0) return "Eid al-Adha today";
  return `Eid al-Adha in ${info.daysUntilEidAlAdha} days`;
}

// Real Islamic-calendar countdowns (computed from the actual Hijri calendar,
// not a hardcoded date) plus live counts derived from the same event/country
// data shown on the map — nothing here is a placeholder number.
export function UmmahTicker({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const info = useMemo(() => getIslamicCalendarInfo(), []);

  const stats = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      humanitarianResponses: published.filter((e) => e.category === "humanitarian").length,
      goodNewsToday: published.filter((e) => e.category === "good_news" && Date.now() - e.timestamp < 86400_000).length,
    };
  }, [events, countries]);

  const items: { icon: string; label: string }[] = [
    { icon: "🌙", label: ramadanLabel(info) },
    { icon: "🕌", label: eidAlFitrLabel(info) },
    { icon: "🕋", label: hajjLabel(info) },
    { icon: "🐑", label: eidAlAdhaLabel(info) },
    { icon: "🌍", label: `${stats.countriesMonitored} countries monitored` },
    { icon: "🚨", label: `${stats.activeEmergencies} active emergencies` },
    { icon: "❤️", label: `${stats.humanitarianResponses} humanitarian responses tracked` },
    { icon: "✨", label: `${stats.goodNewsToday} good news ${stats.goodNewsToday === 1 ? "story" : "stories"} today` },
  ];
  const loop = [...items, ...items];

  return (
    <div className="ticker ummah-ticker">
      <div className="ticker-label ummah">
        <span className="live-dot" />
        Ummah Pulse
      </div>
      <div className="ticker-scroll">
        {loop.map((it, i) => (
          <span key={i} className="ticker-item">
            {it.icon} {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
