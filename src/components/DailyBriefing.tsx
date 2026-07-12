"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface BriefingData {
  bullets: string[];
  readSeconds: number;
  live: boolean;
  generatedAt: number;
}

// The "Today's Ummah" synthesis — an AI-generated, balanced digest of recent
// verified events, distinct from any single event's brief. Cached server-side
// (see lib/briefing.ts), so this is cheap to show prominently.
export function DailyBriefing() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    api<BriefingData>("/api/briefing?scope=global")
      .then((r) => alive && setData(r))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="briefing-panel">
        <div className="ai-load" style={{ padding: "12px 15px" }}>
          <span className="spinner" />
          Preparing today's briefing…
        </div>
      </div>
    );
  }
  if (!data || data.bullets.length === 0) return null;

  return (
    <div className="briefing-panel">
      <button className="briefing-hd" onClick={() => setExpanded((v) => !v)}>
        <span style={{ fontSize: 15 }}>🕌</span>
        <span className="briefing-title">Today's Ummah</span>
        <span className="briefing-meta">
          {data.bullets.length} developments · ~{Math.max(1, Math.round(data.readSeconds / 60)) < 1
            ? `${data.readSeconds}s`
            : `${Math.round(data.readSeconds / 60)} min`} read
        </span>
        <span className="briefing-chevron">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <div className="briefing-body">
          <ul>
            {data.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {!data.live && (
            <p className="briefing-fallback">Showing top recent developments — live synthesis unavailable.</p>
          )}
        </div>
      )}
    </div>
  );
}
