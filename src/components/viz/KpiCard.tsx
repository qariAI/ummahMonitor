"use client";

import { useEffect, useRef, useState } from "react";

// Simple requestAnimationFrame count-up — no library. Respects
// prefers-reduced-motion by jumping straight to the final value.
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    startRef.current = null;
    let raf: number;
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export function KpiCard({ icon, value, label, accent }: { icon: string; value: number; label: string; accent?: string }) {
  const animated = useCountUp(value);
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        {accent && <span className="kpi-accent" style={{ background: accent }} />}
      </div>
      <div className="kpi-num">{animated.toLocaleString()}</div>
      <div className="kpi-lbl">{label}</div>
    </div>
  );
}
