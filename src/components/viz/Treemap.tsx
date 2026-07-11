"use client";

import { useMemo, useState } from "react";
import type { EventDTO } from "@/lib/repos";
import { CATEGORIES, resolveVar, type CategoryKey } from "@/lib/client";
import { squarify } from "@/lib/treemap";

const W = 640;
const H = 340;

export function Treemap({ events, onSelectCountry }: { events: EventDTO[]; onSelectCountry: (name: string) => void }) {
  const [drill, setDrill] = useState<CategoryKey | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const categoryRects = useMemo(() => {
    const counts = new Map<CategoryKey, number>();
    for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    const inputs = Array.from(counts.entries()).map(([cat, value]) => ({ item: cat, value }));
    return squarify(inputs, 0, 0, W, H);
  }, [events]);

  const countryRects = useMemo(() => {
    if (!drill) return [];
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.category !== drill) continue;
      counts.set(e.country, (counts.get(e.country) ?? 0) + 1);
    }
    const inputs = Array.from(counts.entries()).map(([country, value]) => ({ item: country, value }));
    return squarify(inputs, 0, 0, W, H);
  }, [events, drill]);

  return (
    <div className="viz-card">
      <div className="viz-hd">
        <h3>Events by category{drill ? ` → ${CATEGORIES[drill].label}` : ""}</h3>
        {drill ? (
          <button className="viz-back" onClick={() => setDrill(null)}>← All categories</button>
        ) : (
          <span className="viz-sub">Click a tile to see its country breakdown</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Treemap of events by category">
        {!drill && categoryRects.map((r) => {
          const cat = r.item;
          const key = cat;
          const isHover = hoverKey === key;
          const col = resolveVar(CATEGORIES[cat].token);
          return (
            <g key={key} onClick={() => setDrill(cat)} onMouseEnter={() => setHoverKey(key)} onMouseLeave={() => setHoverKey(null)} style={{ cursor: "pointer" }}>
              <rect x={r.x} y={r.y} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} fill={col} fillOpacity={isHover ? 0.5 : 0.28} stroke={col} strokeWidth={1.5} rx={4} />
              {r.w > 60 && r.h > 24 && (
                <>
                  <text x={r.x + 8} y={r.y + 20} className="viz-tile-title">{CATEGORIES[cat].label}</text>
                  {r.h > 40 && <text x={r.x + 8} y={r.y + 36} className="viz-tile-sub">{events.filter((e) => e.category === cat).length} events</text>}
                </>
              )}
            </g>
          );
        })}
        {drill && countryRects.map((r) => {
          const country = r.item;
          const isHover = hoverKey === country;
          const col = resolveVar(CATEGORIES[drill].token);
          return (
            <g key={country} onClick={() => onSelectCountry(country)} onMouseEnter={() => setHoverKey(country)} onMouseLeave={() => setHoverKey(null)} style={{ cursor: "pointer" }}>
              <rect x={r.x} y={r.y} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} fill={col} fillOpacity={isHover ? 0.55 : 0.25} stroke={col} strokeWidth={1.5} rx={4} />
              {r.w > 50 && r.h > 22 && <text x={r.x + 7} y={r.y + 19} className="viz-tile-title">{country}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
