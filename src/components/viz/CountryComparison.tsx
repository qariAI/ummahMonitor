"use client";

import { useState } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { scoreColorToken, trendGlyph } from "@/lib/client";

const MAX_COMPARE = 4;

// Real per-country sub-scores (already seeded/tracked: Safety, Humanitarian,
// Worship, Economy) side-by-side. Deliberately excludes "casualties" and
// specific "aid flow" figures from the mockup — neither is real tracked
// data here; event counts by category are used instead, which are real.
export function CountryComparison({ countries, events }: { countries: CountryDTO[]; events: EventDTO[] }) {
  const [selected, setSelected] = useState<string[]>(() =>
    [...countries].sort((a, b) => b.score - a.score).slice(0, 3).map((c) => c.name),
  );

  function toggle(name: string) {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, name];
    });
  }

  const compared = countries.filter((c) => selected.includes(c.name));
  const componentKeys = Array.from(new Set(compared.flatMap((c) => Object.keys(c.components ?? {}))));

  function eventCount(countryName: string): number {
    return events.filter((e) => e.country === countryName && e.trust.status !== "withheld").length;
  }

  return (
    <div className="viz-card">
      <div className="viz-hd">
        <h3>Country Comparison</h3>
        <span className="viz-sub">Select up to {MAX_COMPARE} countries</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {countries.map((c) => (
          <button
            key={c.name}
            onClick={() => toggle(c.name)}
            className="chip"
            style={{
              opacity: selected.includes(c.name) ? 1 : 0.45,
              borderColor: selected.includes(c.name) ? "var(--stroke2)" : "var(--stroke)",
            }}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {compared.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--muted)" }}>Select at least one country.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 10px 6px 0", color: "var(--faint)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Metric</th>
                {compared.map((c) => (
                  <th key={c.name} style={{ textAlign: "left", padding: "6px 10px", color: "var(--text)", fontWeight: 700 }}>
                    {c.flag} {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--stroke)" }}>
                <td style={{ padding: "8px 10px 8px 0", color: "var(--muted)" }}>Situation Index</td>
                {compared.map((c) => (
                  <td key={c.name} style={{ padding: "8px 10px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: `var(${scoreColorToken(c.score)})` }}>{c.score}</span>
                    {" "}
                    <span style={{ color: "var(--faint)" }}>{trendGlyph[c.trend]}</span>
                  </td>
                ))}
              </tr>
              <tr style={{ borderTop: "1px solid var(--stroke)" }}>
                <td style={{ padding: "8px 10px 8px 0", color: "var(--muted)" }}>Rank</td>
                {compared.map((c) => (
                  <td key={c.name} style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>#{c.rank} of {c.totalCountries}</td>
                ))}
              </tr>
              {componentKeys.map((key) => (
                <tr key={key} style={{ borderTop: "1px solid var(--stroke)" }}>
                  <td style={{ padding: "8px 10px 8px 0", color: "var(--muted)" }}>{key}</td>
                  {compared.map((c) => (
                    <td key={c.name} style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>{c.components?.[key] ?? "—"}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid var(--stroke)" }}>
                <td style={{ padding: "8px 10px 8px 0", color: "var(--muted)" }}>Tracked developments</td>
                {compared.map((c) => (
                  <td key={c.name} style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>{eventCount(c.name)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
