"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "./Nav";
import { PresenterVisualizer } from "./PresenterVisualizer";
import { CATEGORIES, ago, scoreColorToken } from "@/lib/client";
import { statusToken } from "@/lib/confidence";
import {
  HumanitarianPanel,
  DataVizPreview,
  VerifiedSourcesPanel,
} from "./IntelligencePanels";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import type { HolySiteData } from "@/app/api/holy-sites/route";

const SEARCH_EXAMPLES = ["Why is Sudan rising?", "Show Gaza this week", "Compare Yemen and Syria", "What changed overnight?"];

// ── Tile 1: Live Map preview ─────────────────────────────────────────────
function LiveMapTile({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const published = events.filter((e) => e.trust.status !== "withheld");
  const emergencies = published.filter((e) => e.severity === "critical" || e.severity === "high").length;
  return (
    <Link href="/" className="bento-tile bento-map">
      <div className="bento-hd"><span className="bento-num">1</span> LIVE MAP <span className="bento-sub">Real-time overview</span></div>
      <div className="bento-map-preview">
        {published.slice(0, 12).map((e) => (
          <span
            key={e.id}
            className="bento-map-dot"
            style={{
              left: `${((e.lon + 180) / 360) * 100}%`,
              top: `${((90 - e.lat) / 180) * 100}%`,
              background: `var(${CATEGORIES[e.category].token})`,
            }}
          />
        ))}
      </div>
      <div className="bento-live-row">
        <span className="badge" style={{ background: "color-mix(in srgb, var(--conflict) 20%, transparent)", color: "var(--conflict)" }}>● LIVE</span>
        <b>{countries.length}</b> countries <b>{emergencies}</b> emergencies
      </div>
    </Link>
  );
}

// ── Tile 2: AI Broadcast (abstract presenter, not a synthetic human) ────
function BroadcastTile() {
  const [headline, setHeadline] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/briefing?scope=global").then((r) => r.json()).then((r) => setHeadline(r?.data?.bullets?.[0] ?? null)).catch(() => {});
  }, []);
  return (
    <Link href="/broadcast" className="bento-tile">
      <div className="bento-hd"><span className="bento-num">2</span> AI BROADCAST <span className="badge" style={{ marginLeft: "auto", background: "color-mix(in srgb, var(--conflict) 20%, transparent)", color: "var(--conflict)" }}>LIVE</span></div>
      <div style={{ transform: "scale(0.55)", transformOrigin: "top center", margin: "-30px 0" }}>
        <PresenterVisualizer speaking={false} />
      </div>
      <p className="bento-line">{headline ?? "Morning Intelligence Briefing"}</p>
    </Link>
  );
}

// ── Tile 3: Holy Sites Live — real prayer times/weather, no cameras, no crowd density ──
function HolySitesTile() {
  const [sites, setSites] = useState<HolySiteData[] | null>(null);
  useEffect(() => {
    fetch("/api/holy-sites").then((r) => r.json()).then((r) => setSites(r?.data?.sites ?? null)).catch(() => {});
  }, []);
  return (
    <Link href="/holy-sites" className="bento-tile">
      <div className="bento-hd"><span className="bento-num">3</span> HOLY SITES <span className="bento-sub">Prayer times &amp; weather, live</span></div>
      <ul className="bento-list">
        {(sites ?? []).map((s) => (
          <li key={s.id}>
            <span>{s.name}</span>
            <span className="bento-faint">{s.weather ? `${Math.round(s.weather.tempC)}°C` : "—"} · {s.prayerTimes?.fajr ?? "—"} Fajr</span>
          </li>
        ))}
        {!sites && <li className="bento-faint">Loading…</li>}
      </ul>
    </Link>
  );
}

// ── Tile 4: AI Situation — real trend data, no fabricated predictions ───
function AiSituationTile({ countries }: { countries: CountryDTO[] }) {
  const escalating = countries.filter((c) => c.trend === "up").sort((a, b) => b.score - a.score).slice(0, 3);
  const improving = countries.filter((c) => c.trend === "down").sort((a, b) => a.score - b.score).slice(0, 3);
  return (
    <Link href="/ai-intelligence" className="bento-tile">
      <div className="bento-hd"><span className="bento-num">4</span> AI SITUATION <span className="bento-sub">Real trend data, not forecasts</span></div>
      <div className="bento-two-col">
        <div>
          <div className="bento-faint" style={{ marginBottom: 4 }}>▲ Escalating</div>
          {escalating.map((c) => <div key={c.name} style={{ color: `var(${scoreColorToken(c.score)})`, fontSize: 12.5 }}>{c.flag} {c.name}</div>)}
        </div>
        <div>
          <div className="bento-faint" style={{ marginBottom: 4 }}>▼ Improving</div>
          {improving.map((c) => <div key={c.name} style={{ color: `var(${scoreColorToken(c.score)})`, fontSize: 12.5 }}>{c.flag} {c.name}</div>)}
        </div>
      </div>
    </Link>
  );
}

// ── Tile 9: real Timeline Replay (actual event dates), not fake 26-year history ──
function TimelineTile() {
  return (
    <Link href="/?timeline=1" className="bento-tile">
      <div className="bento-hd"><span className="bento-num">9</span> TIMELINE REPLAY <span className="bento-sub">Real event history, replayed</span></div>
      <p className="bento-line">Watch real verified developments appear on the map in the order they actually happened.</p>
      <span className="pill-btn" style={{ display: "inline-flex", marginTop: 8 }}>▶ Open on map</span>
    </Link>
  );
}

// ── Tile 10: AI Search / Copilot ─────────────────────────────────────────
function AiSearchTile() {
  const router = useRouter();
  return (
    <div className="bento-tile">
      <div className="bento-hd"><span className="bento-num">10</span> AI COPILOT <span className="bento-sub">Ask. Discover. Understand.</span></div>
      <div className="chat-suggestions" style={{ flexDirection: "column" }}>
        {SEARCH_EXAMPLES.map((q) => (
          <button key={q} onClick={() => router.push("/chat")}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tile 12: World Pulse — real recent events, not a fabricated globe feed ──
function WorldPulseTile({ events }: { events: EventDTO[] }) {
  const recent = events.filter((e) => e.trust.status !== "withheld").slice(0, 5);
  return (
    <div className="bento-tile">
      <div className="bento-hd"><span className="bento-num">12</span> WORLD PULSE <span className="bento-sub">Every second, everywhere</span></div>
      <ul className="bento-list">
        {recent.map((e) => (
          <li key={e.id}>
            <Link href={`/?event=${e.id}`} style={{ display: "flex", justifyContent: "space-between", width: "100%", textDecoration: "none" }}>
              <span style={{ color: `var(${statusToken(e.trust.status)})` }}>●</span>
              <span style={{ flex: 1, margin: "0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
              <span className="bento-faint">{ago(e.timestamp)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OverviewView({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  return (
    <>
      <Nav />
      <div className="page" style={{ maxWidth: 1500 }}>
        <div className="page-hd">
          <div className="eyebrow">Overview</div>
          <h1>Command Center</h1>
        </div>

        <div className="bento-grid">
          <LiveMapTile events={events} countries={countries} />
          <BroadcastTile />
          <HolySitesTile />
          <AiSituationTile countries={countries} />

          <div className="bento-tile"><div className="bento-hd"><span className="bento-num">5</span> HUMANITARIAN <span className="bento-sub">For NGOs. For impact.</span></div><HumanitarianPanel events={events} /></div>
          <div className="bento-tile"><div className="bento-hd"><span className="bento-num">6</span> DATA &amp; STATISTICS</div><DataVizPreview events={events} /></div>
          <AiSearchTile />
          <div className="bento-tile"><div className="bento-hd"><span className="bento-num">8</span> VERIFIED SOURCES</div><VerifiedSourcesPanel /></div>

          <TimelineTile />
          <WorldPulseTile events={events} />
        </div>
      </div>
    </>
  );
}
