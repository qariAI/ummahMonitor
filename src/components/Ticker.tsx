"use client";

import type { EventDTO } from "@/lib/repos";
import { CATEGORIES, ago } from "@/lib/client";

// Scrolling "breaking" strip of the most recent events, under the nav.
// Pauses on hover; clicking an item opens that event's dossier.
export function Ticker({ events, onSelect }: { events: EventDTO[]; onSelect: (id: number) => void }) {
  const items = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 9);
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="ticker">
      <div className="ticker-label">
        <span className="live-dot" />
        Breaking
      </div>
      <div className="ticker-scroll">
        {loop.map((e, i) => (
          <button key={`${e.id}-${i}`} className="ticker-item" onClick={() => onSelect(e.id)}>
            <span className="cdot" style={{ background: `var(${CATEGORIES[e.category].token})` }} />
            <b style={{ marginRight: 5 }}>{e.country}</b> {e.title} <span className="ticker-ago">{ago(e.timestamp)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
