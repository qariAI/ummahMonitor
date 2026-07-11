"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Nav } from "./Nav";
import { PresenterVisualizer } from "./PresenterVisualizer";
import { api, ago } from "@/lib/client";
import type { CountryDTO, EventDTO } from "@/lib/repos";

interface BriefingData {
  bullets: string[];
  readSeconds: number;
  live: boolean;
  generatedAt: number;
}

const SEGMENTS: { id: string; label: string; scope: string | null }[] = [
  { id: "global", label: "Global Briefing", scope: "global" },
  { id: "regional", label: "Regional Briefing", scope: null }, // needs country picker
  { id: "humanitarian", label: "Humanitarian Update", scope: "category:humanitarian" },
  { id: "conflict", label: "Conflict Watch", scope: "category:conflict" },
  { id: "economy", label: "Economic Outlook", scope: "category:economy" },
  { id: "climate", label: "Climate Update", scope: "climate" },
  { id: "good_news", label: "Beautiful News", scope: "category:good_news" },
];

export function BroadcastView({ initialEvents, countries }: { initialEvents: EventDTO[]; countries: CountryDTO[] }) {
  const [segmentId, setSegmentId] = useState("global");
  const [regionalCountry, setRegionalCountry] = useState(countries[0]?.name ?? "");
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const segment = SEGMENTS.find((s) => s.id === segmentId)!;
  const scope = segment.scope ?? regionalCountry;

  // Load available system voices — real browser capability, not simulated.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSpeechSupported(true);
    function load() {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // Fetch the briefing whenever segment/scope changes; stop any playback in progress.
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setLoading(true);
    let alive = true;
    api<BriefingData>(`/api/briefing?scope=${encodeURIComponent(scope)}`)
      .then((r) => alive && setBriefing(r))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [scope]);

  const stats = useMemo(() => {
    const published = initialEvents.filter((e) => e.trust.status !== "withheld");
    const topCountry = [...countries].sort((a, b) => b.score - a.score)[0];
    return {
      countriesMonitored: countries.length,
      activeEmergencies: published.filter((e) => e.severity === "critical" || e.severity === "high").length,
      topCountry,
      latest: published.slice().sort((a, b) => b.timestamp - a.timestamp)[0],
    };
  }, [initialEvents, countries]);

  function play() {
    if (!briefing || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = briefing.bullets.join(". ");
    const utter = new SpeechSynthesisUtterance(text);
    if (voices[voiceIdx]) utter.voice = voices[voiceIdx];
    utter.rate = rate;
    utter.onstart = () => { setSpeaking(true); setPaused(false); };
    utter.onend = () => { setSpeaking(false); setPaused(false); };
    utter.onerror = () => { setSpeaking(false); setPaused(false); };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }
  function togglePause() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (paused) { window.speechSynthesis.resume(); setPaused(false); }
    else { window.speechSynthesis.pause(); setPaused(true); }
  }
  function stop() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  function copyTranscript() {
    if (!briefing) return;
    navigator.clipboard?.writeText(briefing.bullets.join("\n\n"));
  }
  function downloadTranscript() {
    if (!briefing) return;
    const blob = new Blob(
      [`UmmahMonitor AI Broadcast — ${segment.label}\nGenerated ${new Date(briefing.generatedAt).toISOString()}\n\n${briefing.bullets.join("\n\n")}`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ummahmonitor-broadcast-${segment.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Nav />
      <div className="broadcast-studio">
        <div className="broadcast-backdrop" />

        <div className="broadcast-segments">
          {SEGMENTS.map((s) => (
            <button key={s.id} className={s.id === segmentId ? "on" : ""} onClick={() => setSegmentId(s.id)}>
              {s.label}
            </button>
          ))}
          {segment.id === "regional" && (
            <select value={regionalCountry} onChange={(e) => setRegionalCountry(e.target.value)} className="broadcast-country-select">
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="broadcast-main">
          <PresenterVisualizer speaking={speaking} />

          <div className="broadcast-panel">
            <div className="broadcast-panel-hd">
              <span className="live-dot" />
              {segment.label}
              {segment.id === "regional" && ` — ${regionalCountry}`}
              <span className="badge" style={{ marginLeft: "auto", background: "var(--bg2)", color: "var(--faint)" }}>AI-GENERATED</span>
            </div>

            {loading && <div className="ai-load" style={{ padding: 16 }}><span className="spinner" />Preparing briefing…</div>}

            {!loading && briefing && (
              <>
                <div className="broadcast-controls">
                  {!speaking && <button className="pill-btn" onClick={play}>▶ Play</button>}
                  {speaking && <button className="pill-btn" onClick={togglePause}>{paused ? "▶ Resume" : "⏸ Pause"}</button>}
                  {speaking && <button className="pill-btn" onClick={stop}>■ Stop</button>}
                  <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="broadcast-select">
                    <option value={0.75}>0.75×</option>
                    <option value={1}>1×</option>
                    <option value={1.25}>1.25×</option>
                    <option value={1.5}>1.5×</option>
                  </select>
                  {voices.length > 0 && (
                    <select value={voiceIdx} onChange={(e) => setVoiceIdx(Number(e.target.value))} className="broadcast-select">
                      {voices.map((v, i) => (
                        <option key={v.name} value={i}>{v.name} ({v.lang})</option>
                      ))}
                    </select>
                  )}
                  <button className="pill-btn" onClick={() => setShowTranscript((v) => !v)}>{showTranscript ? "Hide" : "Show"} transcript</button>
                  <button className="pill-btn" onClick={copyTranscript}>Copy</button>
                  <button className="pill-btn" onClick={downloadTranscript}>Download .txt</button>
                </div>

                {showTranscript && (
                  <ul className="broadcast-transcript">
                    {briefing.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {!briefing.live && <p className="briefing-fallback" style={{ padding: "0 4px" }}>Showing top recent developments — live synthesis unavailable.</p>}
                {segment.id === "climate" && (
                  <p style={{ fontSize: 10.5, color: "var(--faint)", padding: "0 4px" }}>
                    No dedicated climate category exists yet — this segment uses a best-effort keyword filter over humanitarian/conflict/economy events, not a verified taxonomy.
                  </p>
                )}
                {!speechSupported && (
                  <p style={{ fontSize: 10.5, color: "var(--faint)", padding: "0 4px" }}>Voice playback isn't supported in this browser.</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="broadcast-lower-third">
          <span className="broadcast-lt-label">SITUATION INDEX</span>
          {stats.topCountry && <span>{stats.topCountry.name} {stats.topCountry.score}</span>}
          <span className="broadcast-lt-sep">·</span>
          <span>{stats.countriesMonitored} countries monitored</span>
          <span className="broadcast-lt-sep">·</span>
          <span>{stats.activeEmergencies} active emergencies</span>
          {stats.latest && (
            <>
              <span className="broadcast-lt-sep">·</span>
              <span>Latest: {stats.latest.title} ({ago(stats.latest.timestamp)})</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
