"use client";

import { useMemo, useState } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { scoreColorToken } from "@/lib/client";

const W = 640;
const H = 380;
const MARGIN = { top: 20, right: 24, bottom: 44, left: 48 };

export function BubbleChart({
  countries,
  events,
  onSelectCountry,
}: {
  countries: CountryDTO[];
  events: EventDTO[];
  onSelectCountry: (name: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const points = useMemo(() => {
    const byCountry = new Map<string, EventDTO[]>();
    for (const e of events) {
      if (!byCountry.has(e.country)) byCountry.set(e.country, []);
      byCountry.get(e.country)!.push(e);
    }
    return countries
      .map((c) => {
        const evs = byCountry.get(c.name) ?? [];
        const activeEmergencies = evs.filter((e) => e.severity === "critical" || e.severity === "high").length;
        return { country: c, eventCount: evs.length, activeEmergencies };
      })
      .filter((p) => p.eventCount > 0);
  }, [countries, events]);

  const maxEventCount = Math.max(1, ...points.map((p) => p.eventCount));
  const maxEmergencies = Math.max(1, ...points.map((p) => p.activeEmergencies));

  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  const xFor = (score: number) => MARGIN.left + (score / 100) * plotW;
  const yFor = (count: number) => MARGIN.top + plotH - (count / maxEventCount) * plotH;
  const rFor = (emergencies: number) => 5 + (emergencies / maxEmergencies) * 22;

  return (
    <div className="viz-card">
      <div className="viz-hd">
        <h3>Countries by situation &amp; activity</h3>
        <span className="viz-sub">X: Situation Index · Y: events tracked · size: active emergencies</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Bubble chart of countries by situation index and event activity">
        {[0, 25, 50, 75, 100].map((t) => (
          <line key={`vx-${t}`} x1={xFor(t)} y1={MARGIN.top} x2={xFor(t)} y2={MARGIN.top + plotH} stroke="var(--stroke)" strokeWidth={1} />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={`hy-${f}`} x1={MARGIN.left} y1={MARGIN.top + plotH * (1 - f)} x2={MARGIN.left + plotW} y2={MARGIN.top + plotH * (1 - f)} stroke="var(--stroke)" strokeWidth={1} />
        ))}
        {[0, 25, 50, 75, 100].map((t) => (
          <text key={`xl-${t}`} x={xFor(t)} y={H - 24} textAnchor="middle" className="viz-axis-label">{t}</text>
        ))}
        <text x={MARGIN.left + plotW / 2} y={H - 6} textAnchor="middle" className="viz-axis-title">Situation Index</text>
        <text x={14} y={MARGIN.top + plotH / 2} textAnchor="middle" className="viz-axis-title" transform={`rotate(-90 14 ${MARGIN.top + plotH / 2})`}>
          Events tracked
        </text>

        {points.map((p) => {
          const cx = xFor(p.country.score);
          const cy = yFor(p.eventCount);
          const r = rFor(p.activeEmergencies);
          const isHover = hover === p.country.name;
          return (
            <g
              key={p.country.name}
              onMouseEnter={() => setHover(p.country.name)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectCountry(p.country.name)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={cx} cy={cy} r={r}
                fill={`var(${scoreColorToken(p.country.score)})`}
                fillOpacity={isHover ? 0.55 : 0.32}
                stroke={`var(${scoreColorToken(p.country.score)})`}
                strokeWidth={isHover ? 2 : 1}
              />
              {r > 12 && (
                <text x={cx} y={cy + 4} textAnchor="middle" className="viz-bubble-label">{p.country.code}</text>
              )}
              {isHover && (
                <g transform={`translate(${Math.min(cx + r + 8, W - 150)}, ${Math.max(cy - 20, MARGIN.top)})`}>
                  <rect width={148} height={54} rx={8} fill="var(--panel-solid)" stroke="var(--stroke2)" />
                  <text x={10} y={18} className="viz-tooltip-title">{p.country.name}</text>
                  <text x={10} y={34} className="viz-tooltip-line">Index {p.country.score} · {p.eventCount} events</text>
                  <text x={10} y={48} className="viz-tooltip-line">{p.activeEmergencies} active emergencies</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
