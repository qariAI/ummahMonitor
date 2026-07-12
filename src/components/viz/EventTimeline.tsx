"use client";

import { useMemo, useState } from "react";
import type { EventDTO } from "@/lib/repos";
import { CATEGORIES, resolveVar, ago } from "@/lib/client";

const W = 900;
const H = 220;
const MARGIN = { top: 16, right: 20, bottom: 34, left: 20 };
const LANES = Object.keys(CATEGORIES).length;
const LANE_H = (H - MARGIN.top - MARGIN.bottom) / LANES;

export function EventTimeline({ events, onSelectEvent }: { events: EventDTO[]; onSelectEvent: (id: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);

  const { points, minT, maxT } = useMemo(() => {
    if (events.length === 0) return { points: [], minT: 0, maxT: 1 };
    const times = events.map((e) => e.timestamp);
    return { points: events, minT: Math.min(...times), maxT: Math.max(...times) };
  }, [events]);

  const span = Math.max(1, maxT - minT);
  const plotW = W - MARGIN.left - MARGIN.right;
  const xFor = (t: number) => MARGIN.left + ((t - minT) / span) * plotW;

  const categoryKeys = Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[];
  const laneFor = (cat: keyof typeof CATEGORIES) => categoryKeys.indexOf(cat);

  const sevR: Record<string, number> = { critical: 6, high: 5, medium: 4, low: 3 };

  // A handful of date ticks across the span for orientation.
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => minT + (span * i) / (tickCount - 1));

  return (
    <div className="viz-card">
      <div className="viz-hd">
        <h3>Event timeline</h3>
        <span className="viz-sub">Real event timestamps, one lane per category</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Timeline of events colored by category">
        {categoryKeys.map((cat, i) => (
          <line key={cat} x1={MARGIN.left} y1={MARGIN.top + i * LANE_H + LANE_H / 2} x2={W - MARGIN.right} y2={MARGIN.top + i * LANE_H + LANE_H / 2} stroke="var(--stroke)" strokeWidth={1} />
        ))}
        {ticks.map((t, i) => (
          <text key={i} x={xFor(t)} y={H - 14} textAnchor="middle" className="viz-axis-label">
            {new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        ))}
        {points.map((e) => {
          const cx = xFor(e.timestamp);
          const cy = MARGIN.top + laneFor(e.category) * LANE_H + LANE_H / 2;
          const r = sevR[e.severity] ?? 4;
          const col = resolveVar(CATEGORIES[e.category].token);
          const isHover = hover === e.id;
          return (
            <g key={e.id} onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelectEvent(e.id)} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={isHover ? r + 2 : r} fill={col} fillOpacity={isHover ? 1 : 0.75} stroke="var(--bg)" strokeWidth={1} />
              {isHover && (
                <g transform={`translate(${Math.min(cx + 10, W - 210)}, ${Math.max(cy - 40, MARGIN.top)})`}>
                  <rect width={200} height={50} rx={8} fill="var(--panel-solid)" stroke="var(--stroke2)" />
                  <text x={9} y={17} className="viz-tooltip-title" style={{ fontSize: 10.5 }}>{e.title.slice(0, 42)}{e.title.length > 42 ? "…" : ""}</text>
                  <text x={9} y={32} className="viz-tooltip-line">{e.country} · {e.severity}</text>
                  <text x={9} y={45} className="viz-tooltip-line">{ago(e.timestamp)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
