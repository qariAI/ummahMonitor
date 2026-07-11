"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { CATEGORIES, ago, api, severityToken, type CategoryKey } from "@/lib/client";
import { Nav } from "./Nav";
import { WorldMap, type MapLayers, type WorldMapHandle } from "./WorldMap";
import type { QuakeMarker } from "@/lib/liveQuakes";
import type { FlightMarker } from "@/lib/liveFlights";
import type { CryptoTicker as CryptoTickerData } from "@/app/api/live/crypto/route";
import { Dossier } from "./Dossier";
import { SubmitReport } from "./SubmitReport";
import { Ticker } from "./Ticker";
import { CryptoTicker } from "./CryptoTicker";
import { SignalsRail } from "./SignalsRail";
import { useAuth } from "./Providers";

const RANGES = ["24h", "7d", "30d", "all"] as const;
type Range = (typeof RANGES)[number];

export function MapView({
  initialEvents,
  countries,
}: {
  initialEvents: EventDTO[];
  countries: CountryDTO[];
}) {
  const { user } = useAuth();
  const [events, setEvents] = useState(initialEvents);
  const [range, setRange] = useState<Range>("all");
  const [active, setActive] = useState<Record<CategoryKey, boolean>>({
    faith: true, community: true, humanitarian: true, conflict: true, economy: true, education: true, good_news: true,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [layers, setLayers] = useState<MapLayers>({
    events: true, corridors: true, pulses: true, pressure: true, graticule: true,
    quakes: true, flights: true,
  });
  const [layersOpen, setLayersOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [quakes, setQuakes] = useState<QuakeMarker[]>([]);
  const [flights, setFlights] = useState<FlightMarker[]>([]);
  const [tickers, setTickers] = useState<CryptoTickerData[]>([]);
  const mapRef = useRef<WorldMapHandle>(null);

  // Poll the live layers independently — quakes refresh slowly (USGS is
  // ~1min-cached upstream), flights faster (OpenSky moves quickly). Each
  // request is best-effort: a failed/rate-limited fetch just keeps the last
  // known markers rather than clearing the layer.
  useEffect(() => {
    let stop = false;
    async function pollQuakes() {
      try {
        const r = await api<{ quakes: QuakeMarker[] }>("/api/live/quakes");
        if (!stop) setQuakes(r.quakes);
      } catch {}
    }
    pollQuakes();
    const id = setInterval(pollQuakes, 60_000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    let stop = false;
    async function pollFlights() {
      try {
        const r = await api<{ flights: FlightMarker[] }>("/api/live/flights");
        if (!stop) setFlights(r.flights);
      } catch {}
    }
    pollFlights();
    const id = setInterval(pollFlights, 30_000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    let stop = false;
    async function pollCrypto() {
      try {
        const r = await api<{ tickers: CryptoTickerData[] }>("/api/live/crypto");
        if (!stop) setTickers(r.tickers);
      } catch {}
    }
    pollCrypto();
    const id = setInterval(pollCrypto, 60_000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  // Apply the categories chosen in /onboarding as the default feed filter,
  // once — after that, the user's own chip toggles take over.
  const appliedPrefs = useRef(false);
  useEffect(() => {
    if (appliedPrefs.current || !user?.categories) return;
    appliedPrefs.current = true;
    if (user.categories.length === 0) return;
    const chosen = new Set(user.categories);
    setActive((a) => {
      const next = { ...a };
      (Object.keys(next) as CategoryKey[]).forEach((k) => {
        next[k] = chosen.has(k);
      });
      return next;
    });
  }, [user]);

  // Re-fetch when the time range changes.
  useEffect(() => {
    api<{ events: EventDTO[] }>(`/api/events?range=${range}`)
      .then((r) => setEvents(r.events))
      .catch(() => {});
  }, [range]);

  const filtered = useMemo(
    () => events.filter((e) => active[e.category as CategoryKey]),
    [events, active],
  );
  const selected = filtered.find((e) => e.id === selectedId) ?? events.find((e) => e.id === selectedId) ?? null;
  const selectedCountry = selected ? countries.find((c) => c.name === selected.country) ?? null : null;

  const countryByName = useMemo(() => new Map(countries.map((c) => [c.name, c])), [countries]);

  return (
    <>
      <Nav>
        <div className="range-ctl" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
        <button className="pill-btn" onClick={() => setLayersOpen((v) => !v)}>
          ⧉ Layers
        </button>
        <button className="pill-btn" onClick={() => setSubmitOpen(true)} title={user ? "" : "Anyone can submit; held for review"}>
          + Report
        </button>
      </Nav>

      <Ticker events={filtered} onSelect={setSelectedId} />
      <CryptoTicker tickers={tickers} />

      <div
        className={`map-screen${
          filtered.length && tickers.length
            ? " with-two-tickers"
            : filtered.length || tickers.length
              ? " with-ticker"
              : ""
        }`}
      >
        <WorldMap
          ref={mapRef}
          events={filtered}
          countries={countries}
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          quakes={quakes}
          flights={flights}
        />

        {/* Event feed */}
        <div className="feed-panel">
          <div className="rail-hd">
            <span className="live-dot" />
            <h2>Live feed</h2>
            <span className="count">{filtered.length} events</span>
          </div>
          <div className="chips">
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((c) => (
              <button
                key={c}
                className={`chip${active[c] ? " on" : ""}`}
                onClick={() => setActive((a) => ({ ...a, [c]: !a[c] }))}
              >
                <span className="cdot" style={{ background: `var(${CATEGORIES[c].token})` }} />
                {CATEGORIES[c].label}
              </button>
            ))}
          </div>
          <div className="feed-list">
            {filtered.map((e) => (
              <div
                key={e.id}
                className={`ev${e.id === selectedId ? " sel" : ""}`}
                onClick={() => setSelectedId(e.id)}
              >
                <span className="cdot" style={{ background: `var(${CATEGORIES[e.category].token})` }} />
                <div className="ev-body">
                  <h3>{e.title}</h3>
                  <div className="ev-meta">
                    <span
                      className="sev"
                      style={{ background: `color-mix(in srgb, var(${severityToken(e.severity)}) 18%, transparent)`, color: `var(${severityToken(e.severity)})` }}
                    >
                      {e.severity}
                    </span>
                    <span>{e.country}</span>
                    <span>· {ago(e.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>No events in this range/filter.</p>
            )}
          </div>
        </div>

        {/* Layers popover */}
        {layersOpen && (
          <div
            style={{
              position: "absolute", bottom: 16, left: 16, zIndex: 25,
              background: "var(--panel-solid)", border: "1px solid var(--stroke2)",
              borderRadius: 12, padding: 12, boxShadow: "var(--shadow)", width: 200,
            }}
          >
            {(Object.keys(layers) as (keyof MapLayers)[]).map((k) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", fontSize: 13, textTransform: "capitalize", cursor: "pointer" }}>
                <input type="checkbox" checked={layers[k]} onChange={() => setLayers((l) => ({ ...l, [k]: !l[k] }))} />
                {k}
              </label>
            ))}
          </div>
        )}

        <SignalsRail
          countries={countries}
          events={filtered}
          onSelectCountry={(c) => {
            mapRef.current?.flyTo(c.pos[0], c.pos[1], 3.2);
            const ev = filtered.find((e) => e.country === c.name);
            if (ev) setSelectedId(ev.id);
          }}
          onSelectEvent={(id) => setSelectedId(id)}
        />

        <Dossier event={selected} country={selectedCountry} onClose={() => setSelectedId(null)} onSelectEvent={setSelectedId} />
      </div>

      {submitOpen && (
        <SubmitReport
          countries={countries}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={() => api<{ events: EventDTO[] }>(`/api/events?range=${range}`).then((r) => setEvents(r.events)).catch(() => {})}
        />
      )}
    </>
  );
}
