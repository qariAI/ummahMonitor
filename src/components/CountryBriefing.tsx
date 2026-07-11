"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface BriefingData {
  bullets: string[];
  readSeconds: number;
  live: boolean;
  generatedAt: number;
}

export function CountryBriefing({ country }: { country: string }) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api<BriefingData>(`/api/briefing?scope=${encodeURIComponent(country)}`)
      .then((r) => alive && setData(r))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [country]);

  return (
    <div className="card">
      <h3>AI Briefing</h3>
      {loading && (
        <div className="ai-load">
          <span className="spinner" />
          Synthesizing recent developments…
        </div>
      )}
      {!loading && data && (
        <>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {data.bullets.map((b, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text)" }}>{b}</li>
            ))}
          </ul>
          {!data.live && (
            <p style={{ fontSize: 10.5, color: "var(--faint)", margin: "10px 0 0", fontStyle: "italic" }}>
              Showing top recent developments — live synthesis unavailable.
            </p>
          )}
        </>
      )}
    </div>
  );
}
