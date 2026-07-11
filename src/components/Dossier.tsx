"use client";

import { useEffect, useState } from "react";
import type { EventDTO, CountryDTO } from "@/lib/repos";
import {
  CATEGORIES,
  ago,
  api,
  scoreColorToken,
  severityIcon,
  severityToken,
  trendGlyph,
} from "@/lib/client";
import { GiveSheet } from "./GiveSheet";
import { useAuth, useToast } from "./Providers";
import type { ContextEvent, ContextQuake, ContextFlight } from "@/app/api/context/route";

function initials(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "UM";
}

// ── Verification panel — renders the shared trust assessment verbatim ────────
function Verification({ event }: { event: EventDTO }) {
  const t = event.trust;
  const color = `var(${t.status === "published" ? "--faith" : t.status === "developing" ? "--humanitarian" : "--conflict"})`;
  return (
    <div className="sect">
      <h4>Verification</h4>
      <div className="tcap">
        <span className="td2" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <span className="tl2" style={{ color }}>{t.statusLabel}</span>
        <span className="ts2">{t.captionSub}</span>
      </div>
      <div
        className="conf-box"
        style={{
          borderColor: `color-mix(in srgb, ${color} 26%, transparent)`,
          background: `color-mix(in srgb, ${color} 6%, transparent)`,
        }}
      >
        <div className="conf-top">
          <div className="conf-num" style={{ color }}>
            {t.confidence}
            <small>% confidence</small>
          </div>
          <span
            className="conf-pill"
            style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
          >
            {t.statusLabel}
          </span>
        </div>
        <div className="conf-meter">
          <div className="fw">
            <i style={{ width: `${t.confidence}%`, background: color }} />
          </div>
          <div className="thr" style={{ left: `${t.threshold}%` }} />
        </div>
        <div className="conf-scale">
          <span style={{ position: "absolute", left: 0 }}>0</span>
          <span style={{ position: "absolute", left: `${t.threshold}%`, transform: "translateX(-50%)", color: "var(--muted)" }}>
            ▲ {t.threshold}
          </span>
          <span style={{ position: "absolute", right: 0 }}>100</span>
        </div>
        <div className="conf-note">{t.note}</div>
      </div>
      <div className="corrob-hd">
        <h5>Corroboration</h5>
        <span
          className="cl"
          style={{ color: t.independent >= 3 ? "var(--faith)" : t.independent >= 1 ? "var(--humanitarian)" : "var(--conflict)" }}
        >
          {t.corroborationLine}
        </span>
      </div>
      {t.sources.map((s, i) => (
        <div className="crow2" key={i}>
          <div className="ci2">{initials(s.name)}</div>
          <div className="cnm">
            <div className="nm">{s.name}</div>
            <div className="dt">{s.detail}</div>
          </div>
          <span
            className="tp"
            style={{ background: `color-mix(in srgb, var(${s.tierToken}) 16%, transparent)`, color: `var(${s.tierToken})` }}
          >
            {s.tierLabel.toUpperCase()}
          </span>
          <span className="cst" style={{ color: s.corroborating ? "var(--faith)" : "var(--humanitarian)" }}>
            {s.corroborating ? "✓" : "◐"}
          </span>
        </div>
      ))}
      {t.requirement && (
        <div
          className="req-box"
          style={{
            border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`,
            background: `color-mix(in srgb, ${color} 7%, transparent)`,
          }}
        >
          <div className="rh" style={{ color }}>
            <span>{t.requirement.icon}</span>
            {t.requirement.title}
          </div>
          <div className="rt">{t.requirement.text}</div>
        </div>
      )}
    </div>
  );
}

// ── AI Situational Brief — server-side LLM with fallback ─────────────────────
function AiBrief({ eventId }: { eventId: number }) {
  const [state, setState] = useState<{ text: string; note?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<{ brief: { text: string; note?: string } }>("/api/brief", {
      method: "POST",
      body: JSON.stringify({ eventId }),
    })
      .then((r) => alive && setState(r.brief))
      .catch(() => alive && setState({ text: "Brief unavailable.", note: "Live analyst unavailable." }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [eventId, nonce]);

  return (
    <div className="sect">
      <h4>AI Situational Brief</h4>
      <div className="ai-box">
        <div className="ai-hd">
          <span>✦ Analyst engine</span>
          <button onClick={() => setNonce((n) => n + 1)} title="Regenerate">↻ Regenerate</button>
        </div>
        {loading ? (
          <div className="ai-load">
            <span className="spinner" />
            Generating brief from live signals…
          </div>
        ) : (
          <>
            <p>{state?.text}</p>
            {state?.note && <div className="ai-fallback">{state.note}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Context panel — the core "what's around this" correlation view ─────────
function Context({ event, onSelectEvent }: { event: EventDTO; onSelectEvent?: (id: number) => void }) {
  const [data, setData] = useState<{
    nearbyEvents: ContextEvent[];
    nearbyQuakes: ContextQuake[];
    nearbyFlights: ContextFlight[];
    radiusKm: number;
    windowHours: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    const params = new URLSearchParams({
      lat: String(event.lat),
      lon: String(event.lon),
      timestamp: String(event.timestamp),
      excludeEventId: String(event.id),
    });
    api<typeof data>(`/api/context?${params}`)
      .then((r) => alive && setData(r))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [event.id, event.lat, event.lon, event.timestamp]);

  const total = (data?.nearbyEvents.length ?? 0) + (data?.nearbyQuakes.length ?? 0) + (data?.nearbyFlights.length ?? 0);

  return (
    <div className="sect">
      <h4>Context — what else is happening nearby</h4>
      {loading && (
        <div className="ai-load">
          <span className="spinner" />
          Correlating nearby signals…
        </div>
      )}
      {!loading && data && (
        <>
          <p style={{ fontSize: 11.5, color: "var(--faint)", margin: "0 0 10px" }}>
            Within {data.radiusKm}km · {data.windowHours}h window
            {total === 0 && " — nothing else correlated in range."}
          </p>

          {data.nearbyEvents.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {data.nearbyEvents.length} other incident{data.nearbyEvents.length === 1 ? "" : "s"}
              </div>
              {data.nearbyEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent?.(e.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                    padding: "5px 4px", background: "none", border: "none", cursor: onSelectEvent ? "pointer" : "default",
                    fontSize: 12.5, color: "var(--text)",
                  }}
                >
                  <span className="cdot" style={{ background: `var(${CATEGORIES[e.category as keyof typeof CATEGORIES].token})`, flex: "none" }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                  <span className="mono" style={{ color: "var(--faint)", fontSize: 10.5, flex: "none" }}>{e.distanceKm}km</span>
                </button>
              ))}
            </div>
          )}

          {data.nearbyQuakes.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {data.nearbyQuakes.length} earthquake{data.nearbyQuakes.length === 1 ? "" : "s"}
              </div>
              {data.nearbyQuakes.map((q) => (
                <a
                  key={q.id}
                  href={q.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px", fontSize: 12.5, color: "var(--text)", textDecoration: "none" }}
                >
                  <span style={{ flex: "none", fontFamily: "var(--mono)", color: "#ff7a45", fontWeight: 700 }}>M{q.mag.toFixed(1)}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.place}</span>
                  <span className="mono" style={{ color: "var(--faint)", fontSize: 10.5, flex: "none" }}>{q.distanceKm.toFixed(0)}km</span>
                </a>
              ))}
            </div>
          )}

          {data.nearbyFlights.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {data.nearbyFlights.length} aircraft currently in this airspace
              </div>
              <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0 }}>
                {data.nearbyFlights.slice(0, 6).map((f) => f.callsign || f.icao24).filter(Boolean).join(" · ")}
                {data.nearbyFlights.length > 6 && ` · +${data.nearbyFlights.length - 6} more`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


const TYPE_TOKEN: Record<string, string> = {
  relief: "--faith",
  official: "--community",
  medical: "--education",
  rescue: "--humanitarian",
};
const PHASES: [string, string, string][] = [
  ["ongoing", "Ongoing", "--conflict"],
  ["response", "Response", "--humanitarian"],
  ["recovery", "Recovery", "--faith"],
];

// ── Save (bookmark) toggle — shown in the Dossier header ────────────────────
function SaveButton({ eventId }: { eventId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    api<{ saved: boolean }>(`/api/saved-events?eventId=${eventId}`)
      .then((r) => alive && setSaved(r.saved))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, eventId]);

  async function toggle() {
    if (!user) {
      toast("Sign in to save events");
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await api("/api/saved-events", { method: "DELETE", body: JSON.stringify({ eventId }) });
        setSaved(false);
        toast("Removed from saved");
      } else {
        await api("/api/saved-events", { method: "POST", body: JSON.stringify({ eventId }) });
        setSaved(true);
        toast("Saved — find it on your dashboard");
      }
    } catch {
      toast("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="icon-btn"
      style={{ width: 28, height: 28, color: saved ? "var(--good-news)" : undefined }}
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove from saved" : "Save event"}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}

function Respond({ event }: { event: EventDTO }) {
  const { toast } = useToast();
  const [give, setGive] = useState<{ org: string; appeal: string; note?: string; suggestedAmount?: number } | null>(null);
  const r = event.response;
  if (!r) return null;
  const ci = PHASES.findIndex((p) => p[0] === r.phase);

  return (
    <div className="sect">
      <h4>How can I help?</h4>
      <div className="rphase">
        {PHASES.map((p, i) => {
          const on = i === ci;
          const done = i < ci;
          return (
            <div
              key={p[0]}
              className="ph"
              style={on ? { background: `color-mix(in srgb, var(${p[2]}) 20%, transparent)`, color: `var(${p[2]})`, borderColor: `color-mix(in srgb, var(${p[2]}) 30%, transparent)` } : undefined}
            >
              {i <= ci ? "● " : ""}
              {p[1]}
            </div>
          );
        })}
      </div>

      {r.responders?.length > 0 && (
        <>
          <div className="rsub">
            Verified responders<span className="rc">{r.responders.length} active</span>
          </div>
          {r.responders.map((o, i) => {
            const tok = TYPE_TOKEN[o.type] || "--muted";
            return (
              <div className="rorg" key={i}>
                <div className="rlogo" style={{ background: `color-mix(in srgb, var(${tok}) 15%, transparent)`, color: `var(${tok})` }}>
                  {initials(o.name)}
                </div>
                <div className="rmeta">
                  <div className="rn">{o.name}</div>
                  <div className="rd">{o.note}</div>
                </div>
                {o.verified && <span className="rv">✓ Verified</span>}
              </div>
            );
          })}
        </>
      )}

      {r.donate?.length > 0 && (
        <>
          <div className="rsub">
            Ways to give<span className="rc">verified appeals</span>
          </div>
          {r.donate.map((d, i) => (
            <div className="rdon" key={i}>
              <div className="dmeta">
                <div className="da">{d.org}</div>
                <div className="do">
                  {d.appeal} · {d.note}
                </div>
              </div>
              <button
                className="dgive"
                onClick={() => setGive({ org: d.org, appeal: d.appeal, note: d.note, suggestedAmount: d.suggestedAmount })}
              >
                Give →
              </button>
            </div>
          ))}
        </>
      )}

      <div className="rsub">Take action</div>
      <button className="ract" onClick={() => toast("Following — you'll get official updates on this event")}>
        <span className="aic">🔔</span>
        <div className="atx">
          <div className="at">Follow official updates</div>
          <div className="as">verified sources only</div>
        </div>
        <span className="aar">→</span>
      </button>
      {r.volunteer && (
        <button className="ract" onClick={() => toast("Volunteer registration opened")}>
          <span className="aic">🙌</span>
          <div className="atx">
            <div className="at">Volunteer / offer help</div>
            <div className="as">{r.volunteer}</div>
          </div>
          <span className="aar">→</span>
        </button>
      )}
      <button
        className="ract"
        onClick={() => {
          navigator.clipboard?.writeText(`${event.title} — UmmahMonitor`).catch(() => {});
          toast("Link copied — share to raise awareness");
        }}
      >
        <span className="aic">↗</span>
        <div className="atx">
          <div className="at">Share to raise awareness</div>
          <div className="as">bring eyes to the response</div>
        </div>
        <span className="aar">→</span>
      </button>

      {r.dua && (
        <div className="rdua">
          <h6>🤲 Make du'a</h6>
          <p>{r.dua}</p>
        </div>
      )}

      {give && (
        <GiveSheet target={{ ...give, eventId: event.id }} onClose={() => setGive(null)} />
      )}
    </div>
  );
}

// ── Dossier shell ────────────────────────────────────────────────────────────
export function Dossier({
  event,
  country,
  onClose,
  onSelectEvent,
}: {
  event: EventDTO | null;
  country: CountryDTO | null;
  onClose: () => void;
  onSelectEvent?: (id: number) => void;
}) {
  return (
    <aside className={`dossier${event ? " open" : ""}`} aria-hidden={!event}>
      {event && (
        <div className="dossier-body">
          <div className="dt-top">
            <span className="cat-dot" style={{ background: `var(${CATEGORIES[event.category].token})` }} />
            {CATEGORIES[event.category].label}
            <span className="sev" style={{ background: `color-mix(in srgb, var(${severityToken(event.severity)}) 18%, transparent)`, color: `var(${severityToken(event.severity)})` }}>
              {severityIcon(event.severity)} {event.severity}
            </span>
            <span>· {ago(event.timestamp)}</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <SaveButton eventId={event.id} />
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onClose} title="Close">
                ✕
              </button>
            </span>
          </div>
          <h2>{event.title}</h2>
          <div className="dt-loc">
            ◎ {event.country} · {event.lat.toFixed(2)}°, {event.lon.toFixed(2)}°
          </div>

          {country && (
            <div className="sect">
              <div className="score-box">
                <div className="score-top">
                  <div className="score-num" style={{ color: `var(${scoreColorToken(country.score)})` }}>
                    {country.score}
                  </div>
                  <div className="score-meta">
                    <div className="lbl">Situation Index</div>
                    <div className="dl">
                      {country.name} · rank {country.rank} of {country.totalCountries}
                    </div>
                  </div>
                  <div className={`score-tr tr ${country.trend}`}>
                    {trendGlyph[country.trend]} {country.trend}
                  </div>
                </div>
                <div className="comps">
                  {Object.entries(country.components).map(([k, v]) => (
                    <div className="comp" key={k}>
                      <span className="cl">{k}</span>
                      <span className="cb">
                        <i style={{ width: `${v}%`, background: `var(${scoreColorToken(v)})` }} />
                      </span>
                      <span className="cv">{v}</span>
                    </div>
                  ))}
                </div>
                <a className="drill-link" href={`/country/${encodeURIComponent(country.name)}`}>
                  View full country dashboard <span className="mono">→</span>
                </a>
              </div>
            </div>
          )}

          <Verification event={event} />
          <Context event={event} onSelectEvent={onSelectEvent} />
          <AiBrief eventId={event.id} />
          <Respond event={event} />

          {event.what && (
            <div className="sect">
              <h4>Why it matters</h4>
              <p>{event.why || event.what}</p>
            </div>
          )}
          {event.status && (
            <div className="sect">
              <h4>Current status</h4>
              <p>{event.status}</p>
            </div>
          )}
          {event.timeline.length > 0 && (
            <div className="sect">
              <h4>Timeline</h4>
              {event.timeline.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 12.5 }}>
                  <span className="mono" style={{ color: "var(--faint)", minWidth: 62 }}>{t.at}</span>
                  <span style={{ color: "var(--muted)" }}>{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
