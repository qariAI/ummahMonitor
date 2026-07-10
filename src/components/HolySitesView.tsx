"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { CATEGORIES, ago, api, severityToken } from "@/lib/client";
import type { HolySiteData } from "@/app/api/holy-sites/route";

function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  return <span className="mono">{time}</span>;
}

function SiteCard({ site }: { site: HolySiteData }) {
  return (
    <div className="card">
      <h3>{site.name}</h3>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        {site.city}, {site.country}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--stroke)" }}>
        <span style={{ color: "var(--muted)" }}>Local time</span>
        <LiveClock timezone={site.timezone} />
      </div>

      {site.prayerTimes ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: "10px 0", borderTop: "1px solid var(--stroke)" }}>
          {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as const).map((k) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--faint)", textTransform: "capitalize" }}>{k}</div>
              <div className="mono" style={{ fontSize: 12 }}>{site.prayerTimes![k]}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "var(--faint)", padding: "8px 0", borderTop: "1px solid var(--stroke)" }}>
          Prayer times unavailable right now.
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--stroke)" }}>
        <span style={{ color: "var(--muted)" }}>Weather</span>
        <span>{site.weather ? `${Math.round(site.weather.tempC)}°C · ${Math.round(site.weather.windKph)} km/h wind` : "Unavailable"}</span>
      </div>

      <div style={{ paddingTop: 10, borderTop: "1px solid var(--stroke)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          {site.nearbyIncidents.length === 0
            ? "No verified incidents within 15km"
            : `${site.nearbyIncidents.length} verified incident${site.nearbyIncidents.length === 1 ? "" : "s"} within 15km`}
        </div>
        {site.nearbyIncidents.map((e) => (
          <Link
            key={e.id}
            href={`/?event=${e.id}`}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12.5, color: "var(--text)", textDecoration: "none" }}
          >
            <span className="cdot" style={{ background: `var(${CATEGORIES[e.category as keyof typeof CATEGORIES].token})` }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
            <span
              className="sev"
              style={{ background: `color-mix(in srgb, var(${severityToken(e.severity)}) 18%, transparent)`, color: `var(${severityToken(e.severity)})`, flex: "none" }}
            >
              {e.severity}
            </span>
            <span className="mono" style={{ color: "var(--faint)", fontSize: 10.5, flex: "none" }}>{ago(e.timestamp)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HolySitesView() {
  const [sites, setSites] = useState<HolySiteData[] | null>(null);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await api<{ sites: HolySiteData[] }>("/api/holy-sites");
        if (!stop) setSites(r.sites);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 300_000); // prayer times/weather barely change minute to minute
    return () => { stop = true; clearInterval(id); };
  }, []);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Holy sites</div>
          <h1>Live status</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
            Prayer times from Aladhan, weather from Open-Meteo, nearby incidents from UmmahMonitor's own verified
            feed — no unsourced status claims.
          </p>
        </div>

        {!sites && <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading live data…</p>}

        <div className="card-grid">
          {sites?.map((site) => <SiteCard key={site.id} site={site} />)}
        </div>

        <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "var(--faith)", fontSize: 13 }}>
          ← Back to map
        </Link>
      </div>
    </>
  );
}
