"use client";

// Deliberately abstract: a waveform/pulse indicator rather than a synthetic
// human likeness. An avatar styled to "look like a real correspondent"
// would misrepresent AI-generated content as coming from a person — this
// stays honest about what it is while still feeling like a studio presence.
export function PresenterVisualizer({ speaking }: { speaking: boolean }) {
  const bars = 24;
  return (
    <div className="presenter-viz">
      <div className="presenter-ring" data-speaking={speaking}>
        <div className="presenter-core">
          <span className="presenter-badge">AI</span>
        </div>
        <svg viewBox="0 0 200 200" className="presenter-bars">
          {Array.from({ length: bars }).map((_, i) => {
            const angle = (i / bars) * 360;
            const delay = (i / bars) * 1.2;
            return (
              <rect
                key={i}
                x={99} y={6}
                width={2.4} height={speaking ? 14 : 6}
                rx={1.2}
                fill="var(--faith)"
                opacity={speaking ? 0.85 : 0.3}
                transform={`rotate(${angle} 100 100)`}
                style={{
                  transformOrigin: "100px 100px",
                  animation: speaking ? `presenter-pulse 1.1s ease-in-out ${delay}s infinite` : "none",
                }}
              />
            );
          })}
        </svg>
      </div>
      <div className="presenter-label">UmmahMonitor AI Broadcast — synthetic voice, verified data</div>
    </div>
  );
}
