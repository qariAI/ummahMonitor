"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import { CATEGORIES, ago, api, severityIcon, severityToken, type CategoryKey } from "@/lib/client";
import { statusToken } from "@/lib/confidence";
import { Nav } from "./Nav";
import { WorldMap, type MapLayers, type WorldMapHandle } from "./WorldMap";
import type { QuakeMarker } from "@/lib/liveQuakes";
import type { FlightMarker } from "@/lib/liveFlights";
import { StatsBar } from "./StatsBar";
import { MapSummaryWidget } from "./MapSummaryWidget";
import { DailyBriefing } from "./DailyBriefing";
import { Dossier } from "./Dossier";
import { SubmitReport } from "./SubmitReport";
import { Ticker } from "./Ticker";
import { SignalsRail } from "./SignalsRail";
import { TimelineScrubber } from "./TimelineScrubber";
import { IntelligencePanels } from "./IntelligencePanels";
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [range, setRange] = useState<Range>("all");
  const [active, setActive] = useState<Record<CategoryKey, boolean>>({
    faith: true, community: true, humanitarian: true, conflict: true, economy: true, education: true, good_news: true,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [layers, setLayers] = useState<MapLayers>({
    events: true, corridors: true, pulses: true, pressure: true, graticule: true,
    quakes: false, flights: false,
  });
  const [layersOpen, setLayersOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [quakes, setQuakes] = useState<QuakeMarker[]>([]);
  const [flights, setFlights] = useState<FlightMarker[]>([]);
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

  // Re-fetch when the time range changes, and periodically thereafter so
  // "Last updated" reflects real refreshes, not just the initial page load.
  useEffect(() => {
    let stop = false;
    async function fetchEvents() {
      try {
        const r = await api<{ events: EventDTO[] }>(`/api/events?range=${range}`);
        if (!stop) { setEvents(r.events); setLastUpdatedAt(Date.now()); }
      } catch {}
    }
    fetchEvents();
    const id = setInterval(fetchEvents, 120_000);
    return () => { stop = true; clearInterval(id); };
  }, [range]);

  const filtered = useMemo(
    () => events.filter((e) => active[e.category as CategoryKey]),
    [events, active],
  );

  // Timeline Replay — real event timestamps only, no prediction/invented
  // future state. minT/maxT come from whatever's currently filtered so
  // replay always matches the active category selection.
  const [timelineActive, setTimelineActive] = useState(false);
  const timelineBounds = useMemo(() => {
    if (filtered.length === 0) return { minT: Date.now() - 86400_000, maxT: Date.now() };
    const times = filtered.map((e) => e.timestamp);
    return { minT: Math.min(...times), maxT: Math.max(...times) };
  }, [filtered]);
  const [replayTime, setReplayTime] = useState(timelineBounds.maxT);

  function enterTimeline() {
    setReplayTime(timelineBounds.maxT);
    setTimelineActive(true);
  }

  const displayedEvents = timelineActive ? filtered.filter((e) => e.timestamp <= replayTime) : filtered;

  const selected = displayedEvents.find((e) => e.id === selectedId) ?? events.find((e) => e.id === selectedId) ?? null;
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
      <StatsBar events={events} countries={countries} />
      {timelineActive && (
        <TimelineScrubber
          minT={timelineBounds.minT}
          maxT={timelineBounds.maxT}
          replayTime={replayTime}
          onChange={setReplayTime}
          onExit={() => setTimelineActive(false)}
        />
      )}

      <div
        className={`map-screen${filtered.length ? " with-two-tickers" : " with-ticker"}${timelineActive ? " with-timeline" : ""}`}
      >
        <WorldMap
          ref={mapRef}
          events={displayedEvents}
          countries={countries}
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          quakes={quakes}
          flights={flights}
        />

        {/* Event feed */}
        <div className="feed-panel">
          <DailyBriefing />
          <div className="rail-hd">
            <span className="live-dot" />
            <h2>Live feed</h2>
            <span className="count">{displayedEvents.length} events</span>
            <button
              className="pill-btn"
              style={{ marginLeft: "auto", fontSize: 11 }}
              onClick={() => (timelineActive ? setTimelineActive(false) : enterTimeline())}
              title="Replay real event history over time"
            >
              {timelineActive ? "◀ Live" : "🕐 Timeline Replay"}
            </button>
          </div>
          <div className="chips">
            <span style={{ width: "100%", fontSize: 10, color: "var(--faint)", marginBottom: 2 }}>
              Legend — tap a category to filter
            </span>
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
            {displayedEvents.map((e) => (
              <div
                key={e.id}
                className={`ev sev-${e.severity}${e.id === selectedId ? " sel" : ""}`}
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
                      {severityIcon(e.severity)} {e.severity}
                    </span>
                    <span>{e.country}</span>
                    <span>· {ago(e.timestamp)}</span>
                  </div>
                  <div className="ev-trust">
                    <span style={{ color: `var(${statusToken(e.trust.status)})` }}>
                      {e.trust.status === "published" ? "✓ VERIFIED" : e.trust.statusLabel}
                    </span>
                    <span className="ev-trust-sep">·</span>
                    <span>{e.trust.confidence}% confidence</span>
                    <span className="ev-trust-sep">·</span>
                    <span>{e.trust.corroborationLine}</span>
                  </div>
                </div>
              </div>
            ))}
            {displayedEvents.length === 0 && (
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

        <MapSummaryWidget events={displayedEvents} countries={countries} quakes={quakes} flights={flights} />

        <SignalsRail
          countries={countries}
          events={displayedEvents}
          onSelectCountry={(c) => {
            mapRef.current?.flyTo(c.pos[0], c.pos[1], 3.2);
            const ev = displayedEvents.find((e) => e.country === c.name);
            if (ev) setSelectedId(ev.id);
          }}
          onSelectEvent={(id) => setSelectedId(id)}
        />

        <Dossier event={selected} country={selectedCountry} onClose={() => setSelectedId(null)} onSelectEvent={setSelectedId} />
      </div>

      <IntelligencePanels events={events} countries={countries} />

      {submitOpen && (
        <SubmitReport
          countries={countries}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={() => api<{ events: EventDTO[] }>(`/api/events?range=${range}`).then((r) => { setEvents(r.events); setLastUpdatedAt(Date.now()); }).catch(() => {})}
        />
      )}
    </>
  );
}
