import Link from "next/link";
import { Nav } from "./Nav";
import { CATEGORIES, ago, type CategoryKey } from "@/lib/client";
import type { CountryDTO, EventDTO } from "@/lib/repos";
import "@/styles/home.css";

function StarMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden>
      <path
        d="M20 3 L24.8 10.5 L33 8 L30.5 16.2 L38 21 L30.5 25.8 L33 34 L24.8 31.5 L20 39 L15.2 31.5 L7 34 L9.5 25.8 L2 21 L9.5 16.2 L7 8 L15.2 10.5 Z"
        fill="none"
        stroke="var(--good-news)"
        strokeWidth="1.6"
      />
      <circle cx="20" cy="19.5" r="3" fill="var(--good-news)" />
    </svg>
  );
}

function ComingSoon({ note }: { note: string }) {
  return (
    <div className="home-tile-stub">
      <span className="badge" style={{ background: "var(--bg2)", color: "var(--faint)" }}>Coming soon</span>
      <p>{note}</p>
    </div>
  );
}

function TileHeader({ index, eyebrow, title, id }: { index: number; eyebrow: string; title: string; id: string }) {
  return (
    <div id={id} className="home-tile-hd">
      <div className="mono home-tile-eyebrow">{index}. {eyebrow}</div>
      <div className="home-tile-title">{title}</div>
    </div>
  );
}

// Bottom-nav labels/targets mirror the reference layout's condensed 10-item
// bar. Modules without a real page yet link to their own tile on this same
// page instead of a dead route.
const TAB_BAR: { label: string; href: string }[] = [
  { label: "Live Map", href: "/" },
  { label: "AI Studio", href: "#tile-2" },
  { label: "Intelligence", href: "/ai-intelligence" },
  { label: "Holy Sites", href: "/holy-sites" },
  { label: "Humanitarian", href: "#tile-7" },
  { label: "Data", href: "/data" },
  { label: "Calendar", href: "#tile-9" },
  { label: "AI Copilot", href: "/chat" },
  { label: "Timeline", href: "#tile-6" },
  { label: "World Pulse", href: "#tile-12" },
];

export function HomeView({ events, countries }: { events: EventDTO[]; countries: CountryDTO[] }) {
  const published = events.filter((e) => e.trust.status !== "withheld");
  const activeEmergencies = published.filter((e) => e.severity === "critical" || e.severity === "high").length;

  const catCounts = (Object.keys(CATEGORIES) as CategoryKey[]).map((key) => ({
    key,
    label: CATEGORIES[key].label,
    token: CATEGORIES[key].token,
    count: published.filter((e) => e.category === key).length,
  }));
  const maxCatCount = Math.max(1, ...catCounts.map((c) => c.count));

  const escalating = countries.filter((c) => c.trend === "up").sort((a, b) => b.score - a.score).slice(0, 2);

  const recentEvents = [...published].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

  return (
    <>
      <Nav />
      <div className="home-page">
        <header className="home-hero">
          <div className="home-hero-mark">
            <StarMark />
            <h1>UMMAHMONITOR</h1>
          </div>
          <div className="mono home-hero-tagline">Real-time Intelligence. Greater Good.</div>
        </header>

        <div className="home-grid">
          {/* 1. LIVE MAP — real */}
          <Link href="/" className="home-tile home-tile-link">
            <TileHeader index={1} eyebrow="LIVE MAP" title="Real-time Overview" id="tile-1" />
            <div className="home-tile-chips mono">
              <span className="home-chip home-chip-on">Live Feed</span>
              <span className="home-chip">AI</span>
              <span className="home-chip">Data</span>
              <span className="home-chip">Holy Sites</span>
            </div>
            <div className="home-map-preview" />
            <div className="home-live-row">
              <span className="home-live-badge mono"><i className="home-live-dot" />LIVE</span>
              <div className="home-stat">
                <div className="home-stat-num">{countries.length}</div>
                <div className="mono home-stat-lbl">COUNTRIES</div>
              </div>
              <div className="home-stat">
                <div className="home-stat-num">{activeEmergencies}</div>
                <div className="mono home-stat-lbl">EMERGENCIES</div>
              </div>
            </div>
          </Link>

          {/* 2. AI NEWS STUDIO — stub */}
          <div className="home-tile">
            <TileHeader index={2} eyebrow="AI NEWS STUDIO" title="Your AI News Broadcast" id="tile-2" />
            <ComingSoon note="An AI-generated video anchor reading live headlines. Needs a video/avatar generation pipeline — not yet scoped." />
            <p className="home-tile-footnote">
              For a real, working audio briefing today, see <Link href="/broadcast">Broadcast Studio</Link>.
            </p>
          </div>

          {/* 3. HOLY SITES LIVE — partially real (prayer times/weather), camera feeds stubbed */}
          <Link href="/holy-sites" className="home-tile home-tile-link">
            <TileHeader index={3} eyebrow="HOLY SITES LIVE" title="Sacred Places. Live & Verified." id="tile-3" />
            <ComingSoon note="Live camera streams from Kaaba, Al Masjid an Nabawi, Al Aqsa and more — needs real stream sources." />
            <p className="home-tile-footnote">Real prayer times &amp; weather already live →</p>
          </Link>

          {/* 4. AI SITUATION — stub for predictions, real rankings live at /ai-intelligence */}
          <Link href="/ai-intelligence" className="home-tile home-tile-link">
            <TileHeader index={4} eyebrow="AI SITUATION" title="Intelligence. Not Just News." id="tile-4" />
            <ComingSoon note="A predictive risk model — no scoring model exists yet, so no forecast is shown here." />
            <p className="home-tile-footnote">Real Situation Index rankings already live →</p>
          </Link>

          {/* 5. BROADCAST STUDIO — stub for video anchor, real audio briefing live at /broadcast */}
          <Link href="/broadcast" className="home-tile home-tile-link">
            <TileHeader index={5} eyebrow="BROADCAST STUDIO" title="AI Generated. Human Verified." id="tile-5" />
            <ComingSoon note="An AI video anchor presenting the briefing on camera — not yet built." />
            <p className="home-tile-footnote">Real spoken briefing (text-to-speech) already live →</p>
          </Link>

          {/* 6. TIMELINE — stub */}
          <div className="home-tile">
            <TileHeader index={6} eyebrow="TIMELINE" title="Watch History Unfold." id="tile-6" />
            <ComingSoon note="A scrubbable 2000–2026 history of conflict, aid, weather and disease density. Needs historical backfill beyond current event data." />
          </div>

          {/* 7. HUMANITARIAN — stub */}
          <div className="home-tile">
            <TileHeader index={7} eyebrow="HUMANITARIAN" title="For NGOs. For Impact." id="tile-7" />
            <div className="home-humanitarian-grid">
              {(["humanitarian", "faith", "community", "conflict", "education", "economy"] as CategoryKey[]).map((k) => (
                <span key={k} className="home-cat-chip" style={{ color: `var(${CATEGORIES[k].token})` }}>
                  {CATEGORIES[k].label}
                </span>
              ))}
            </div>
            <ComingSoon note="Aggregate reach numbers (countries, people, active NGOs) need a real NGO/operations data source." />
          </div>

          {/* 8. DATA & STATISTICS — real, reuses /data's category model */}
          <Link href="/data" className="home-tile home-tile-link">
            <TileHeader index={8} eyebrow="DATA & STATISTICS" title="Visualize. Compare. Understand." id="tile-8" />
            <div className="home-data-grid">
              {catCounts.map((c) => (
                <div key={c.key} className="home-data-cell">
                  <div className="home-data-cell-bar">
                    <div style={{ width: `${(c.count / maxCatCount) * 100}%`, background: `var(${c.token})` }} />
                  </div>
                  <span>{c.label}</span>
                  <span className="mono home-data-cell-count">{c.count}</span>
                </div>
              ))}
            </div>
          </Link>

          {/* 9. HOLY CALENDAR — stub */}
          <div className="home-tile">
            <TileHeader index={9} eyebrow="HOLY CALENDAR" title="Stay Connected to Key Moments." id="tile-9" />
            <ComingSoon note="Hijri countdown (Muharram, Ramadan, Eid, Hajj, Ashura) and moon phase — no dedicated calendar page yet." />
          </div>

          {/* 10. AI SEARCH / COPILOT — stub tile content, real chat live at /chat */}
          <Link href="/chat" className="home-tile home-tile-link">
            <TileHeader index={10} eyebrow="AI SEARCH / COPILOT" title="Ask. Discover. Understand." id="tile-10" />
            <div className="home-copilot-input mono">Ask anything about the Ummah…</div>
            <p className="home-tile-footnote">Real, grounded AI chat already live →</p>
          </Link>

          {/* 11. LIVE CAMERAS — stub */}
          <div className="home-tile">
            <TileHeader index={11} eyebrow="LIVE CAMERAS" title="Watch Live. From the Heart." id="tile-11" />
            <ComingSoon note="A grid of live holy-site streams — needs real camera stream sources before this can ship." />
          </div>

          {/* 12. WORLD PULSE — real, existing events feed */}
          <div className="home-tile" id="tile-12">
            <TileHeader index={12} eyebrow="WORLD PULSE" title="Every Second. Everywhere." id="tile-12-hd" />
            <div className="home-pulse-glow" />
            <div className="home-pulse-feed">
              {recentEvents.map((e) => (
                <Link key={e.id} href={`/?event=${e.id}`} className="home-pulse-row">
                  <span className="mono home-pulse-time">{ago(e.timestamp)}</span>
                  <span className="home-pulse-title">{e.title}</span>
                </Link>
              ))}
              {recentEvents.length === 0 && <p className="home-tile-footnote">No live events right now.</p>}
            </div>
            <div className="home-pulse-footer mono">
              <span>Live Events</span>
              <span style={{ color: "var(--faith)" }}>{published.length}</span>
            </div>
          </div>
        </div>

        {escalating.length > 0 && (
          <p className="home-tile-footnote" style={{ textAlign: "center", marginTop: 8 }}>
            Rising today: {escalating.map((c) => `${c.flag} ${c.name}`).join(" · ")} — see{" "}
            <Link href="/ai-intelligence">AI Intelligence</Link>
          </p>
        )}
      </div>

      <nav className="home-tab-bar mono" aria-label="Module shortcuts">
        {TAB_BAR.map((t) => (
          <Link key={t.label} href={t.href}>
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
