"use client";

import { useState } from "react";
import type { StorySource } from "@/lib/stories";

const W = 640;
const ROW_H = 26;
const MARGIN = { top: 10, right: 60, bottom: 10, left: 90 };

export function StoryBarChart({
  title,
  unit,
  data,
  thresholds,
  source,
}: {
  title: string;
  unit: string;
  data: { label: string; value: number }[];
  thresholds?: { value: number; label: string }[];
  source: StorySource;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const H = MARGIN.top + MARGIN.bottom + data.length * ROW_H;
  const plotW = W - MARGIN.left - MARGIN.right;
  const maxVal = Math.max(...data.map((d) => d.value), ...(thresholds?.map((t) => t.value) ?? [0])) * 1.05;
  const xFor = (v: number) => (v / maxVal) * plotW;

  return (
    <div className="viz-card" style={{ margin: "20px 0" }}>
      <div className="viz-hd">
        <h3>{title}</h3>
        <span className="viz-sub">{unit} · note the range across countries</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label={title}>
        {thresholds?.map((t) => (
          <g key={t.label}>
            <line
              x1={MARGIN.left + xFor(t.value)} y1={0}
              x2={MARGIN.left + xFor(t.value)} y2={H}
              stroke="var(--conflict)" strokeDasharray="4 3" strokeOpacity={0.5} strokeWidth={1}
            />
            <text x={MARGIN.left + xFor(t.value) + 4} y={12} className="viz-axis-label" fill="var(--conflict)">
              {t.label}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const y = MARGIN.top + i * ROW_H;
          const barW = Math.max(1, xFor(d.value));
          const isHover = hover === i;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <text x={MARGIN.left - 8} y={y + ROW_H / 2 + 4} textAnchor="end" className="viz-tile-sub" fill="var(--text)">
                {d.label}
              </text>
              <rect
                x={MARGIN.left} y={y + 4} width={barW} height={ROW_H - 10} rx={3}
                fill="var(--faith)" fillOpacity={isHover ? 0.85 : 0.55}
              />
              <text x={MARGIN.left + barW + 6} y={y + ROW_H / 2 + 4} className="viz-axis-label" fill="var(--muted)">
                {d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </text>
            </g>
          );
        })}
      </svg>
      <a href={source.url} target="_blank" rel="noreferrer" className="viz-source-link">
        Source: {source.label} ↗
      </a>
    </div>
  );
}
