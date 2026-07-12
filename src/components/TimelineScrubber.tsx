"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [1, 2, 4, 8] as const;

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Replays real event history by advancing a "replay time" playhead — the
// parent filters its real event list down to timestamp <= replayTime. No
// prediction, no invented future state — purely replaying what already
// happened, at real timestamps.
export function TimelineScrubber({
  minT,
  maxT,
  replayTime,
  onChange,
  onExit,
}: {
  minT: number;
  maxT: number;
  replayTime: number;
  onChange: (t: number) => void;
  onExit: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const span = Math.max(1, maxT - minT);
  const progress = Math.min(1, Math.max(0, (replayTime - minT) / span));

  // Advance replayTime in real time, sped up by speedIdx — one real second
  // of playback covers (span / 60) of real event-history time, so a full
  // replay takes ~60s at 1x regardless of how wide the date range is.
  useEffect(() => {
    if (!playing) {
      lastTickRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    function tick(ts: number) {
      if (lastTickRef.current === null) lastTickRef.current = ts;
      const dt = ts - lastTickRef.current;
      lastTickRef.current = ts;
      const perMs = (span / 60000) * SPEEDS[speedIdx];
      const next = replayTime + dt * perMs;
      if (next >= maxT) {
        onChange(maxT);
        setPlaying(false);
        return;
      }
      onChange(next);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speedIdx, replayTime, maxT, span]);

  return (
    <div className="timeline-scrubber">
      <button className="pill-btn" onClick={() => setPlaying((p) => !p)}>
        {playing ? "⏸ Pause" : "▶ Play"}
      </button>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        onChange={(e) => onChange(minT + (Number(e.target.value) / 1000) * span)}
        className="timeline-range"
      />
      <span className="timeline-date">{fmtDate(replayTime)}</span>
      <select value={speedIdx} onChange={(e) => setSpeedIdx(Number(e.target.value))} className="broadcast-select">
        {SPEEDS.map((s, i) => (
          <option key={s} value={i}>{s}×</option>
        ))}
      </select>
      <button className="pill-btn" onClick={onExit}>✕ Exit replay</button>
    </div>
  );
}
