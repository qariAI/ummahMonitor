"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Providers";
import { api, CATEGORIES, type CategoryKey } from "@/lib/client";
import type { Severity } from "@/lib/types";

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

// Submit Report — creates a PENDING event + queue item. The shared confidence
// service caps pending confidence, so it lands WITHHELD until moderated.
export function SubmitReport({
  countries,
  onClose,
  onSubmitted,
}: {
  countries: { name: string }[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState<CategoryKey>("humanitarian");
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState(countries[0]?.name ?? "");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [summary, setSummary] = useState("");
  const [sources, setSources] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          category,
          title,
          country,
          lat: Number(lat) || 0,
          lon: Number(lon) || 0,
          severity,
          summary,
          sources: sources.filter((s) => s.trim()).map((name) => ({ name, verified: false })),
        }),
      });
      toast("Report submitted — held for review below the 70% threshold");
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <h2>Submit a report</h2>
      <p className="sub">Community submissions are held in review and never shown as fact until verified.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Category</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((c) => (
              <button
                type="button"
                key={c}
                className="chip"
                style={category === c ? { borderColor: `var(${CATEGORIES[c].token})`, color: `var(${CATEGORIES[c].token})` } : undefined}
                onClick={() => setCategory(c)}
              >
                <span className="cdot" style={{ background: `var(${CATEGORIES[c].token})` }} />
                {CATEGORIES[c].label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Headline</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label>Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label>Latitude</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 31.53" />
          </div>
          <div className="field">
            <label>Longitude</label>
            <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="e.g. 34.45" />
          </div>
        </div>
        <div className="field">
          <label>Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} required />
        </div>
        <div className="field">
          <label>Sources</label>
          {sources.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input
                value={s}
                placeholder="Source name"
                onChange={(e) => setSources((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {sources.length > 1 && (
                <button type="button" className="icon-btn" onClick={() => setSources((all) => all.filter((_, j) => j !== i))}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-ghost" style={{ height: 36 }} onClick={() => setSources((all) => [...all, ""])}>
            + Add source
          </button>
        </div>
        {error && <p className="err">{error}</p>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? "…" : "Submit for review"}
        </button>
      </form>
    </Modal>
  );
}
