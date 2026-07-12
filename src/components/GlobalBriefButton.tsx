"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "./Modal";

interface BriefingData {
  bullets: string[];
  readSeconds: number;
  live: boolean;
  generatedAt: number;
}

// Persistent across every page — the "killer feature" both rounds of
// feedback called out. Opens the same real, cached global briefing used
// elsewhere (DailyBriefing panel, Broadcast Global segment) — one shared
// source of truth, not a separate generator.
export function GlobalBriefButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    fetch("/api/briefing?scope=global")
      .then((r) => r.json())
      .then((r) => setData(r?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, data]);

  const readLabel = data
    ? data.readSeconds < 60
      ? `${data.readSeconds}s`
      : `${Math.round(data.readSeconds / 60)} min`
    : "";

  return (
    <>
      <button className="global-brief-fab" onClick={() => setOpen(true)} title="Today's Brief">
        🧠 Today's Brief
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div style={{ padding: "22px 24px", maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <h3 style={{ margin: 0, fontSize: 17 }}>Today's Brief</h3>
              {data && <span className="badge" style={{ marginLeft: "auto", background: "var(--bg2)", color: "var(--faint)" }}>{readLabel} read</span>}
            </div>

            {loading && (
              <div className="ai-load" style={{ padding: "10px 0" }}>
                <span className="spinner" /> Preparing today's briefing…
              </div>
            )}

            {!loading && data && (
              <>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)" }}>{b}</li>
                  ))}
                </ul>
                {!data.live && (
                  <p style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 12, fontStyle: "italic" }}>
                    Showing top recent developments — live synthesis unavailable.
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <Link href="/broadcast" className="pill-btn" onClick={() => setOpen(false)}>▶ Listen in Broadcast Studio</Link>
                  <Link href="/" className="pill-btn" onClick={() => setOpen(false)}>View on map</Link>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
