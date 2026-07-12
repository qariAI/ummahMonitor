"use client";

import { useMemo } from "react";
import type { EventDTO } from "@/lib/repos";
import { TIER_META } from "@/lib/confidence";
import type { Tier } from "@/lib/types";

// Real, platform-wide trust metrics — aggregated from the same per-event
// trust assessment used everywhere else. Deliberately does NOT include
// "average verification time" or "AI hallucination risk" — neither is a
// real tracked/measurable metric here, and inventing plausible-looking
// numbers for them would be exactly the kind of fabrication this product
// exists to avoid.
export function ConfidenceAnalytics({ events }: { events: EventDTO[] }) {
  const stats = useMemo(() => {
    const published = events.filter((e) => e.trust.status !== "withheld");
    const avgConfidence = published.length
      ? Math.round(published.reduce((s, e) => s + e.trust.confidence, 0) / published.length)
      : 0;

    const tierCounts = new Map<Tier, number>();
    let totalSources = 0;
    for (const e of published) {
      for (const s of e.trust.sources) {
        tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1);
        totalSources++;
      }
    }
    const tierPct = (Object.keys(TIER_META) as Tier[])
      .map((t) => ({ tier: t, pct: totalSources ? Math.round(((tierCounts.get(t) ?? 0) / totalSources) * 100) : 0 }))
      .filter((t) => t.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    const nonConflicting = published.filter((e) => e.trust.status === "published").length;
    const crossSourceAgreement = published.length ? Math.round((nonConflicting / published.length) * 100) : 0;

    const avgSourcesPerEvent = published.length ? (totalSources / published.length).toFixed(1) : "0";

    return { avgConfidence, tierPct, crossSourceAgreement, avgSourcesPerEvent, publishedCount: published.length };
  }, [events]);

  return (
    <div className="viz-card">
      <div className="viz-hd">
        <h3>Confidence Analytics</h3>
        <span className="viz-sub">Aggregated across {stats.publishedCount} published developments</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 36, fontWeight: 700, color: "var(--faith)" }}>{stats.avgConfidence}%</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>average verification confidence</span>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Source mix
      </div>
      {stats.tierPct.map(({ tier, pct }) => (
        <div key={tier} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 90, flex: "none", fontSize: 11.5, color: "var(--muted)" }}>{TIER_META[tier].label}</span>
          <div style={{ flex: 1, height: 7, background: "var(--bg2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: `var(${TIER_META[tier].token})` }} />
          </div>
          <span style={{ width: 32, flex: "none", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)" }}>{pct}%</span>
        </div>
      ))}

      <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--stroke)" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{stats.crossSourceAgreement}%</div>
          <div style={{ fontSize: 10.5, color: "var(--faint)" }}>cross-source agreement</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{stats.avgSourcesPerEvent}</div>
          <div style={{ fontSize: 10.5, color: "var(--faint)" }}>avg. sources per development</div>
        </div>
      </div>
    </div>
  );
}
