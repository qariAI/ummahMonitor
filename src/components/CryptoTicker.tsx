"use client";

import type { CryptoTicker as CryptoTickerData } from "@/app/api/live/crypto/route";

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toPrecision(3);
}

function fmtChange(c: number | null): string {
  if (c === null) return "—";
  const sign = c >= 0 ? "+" : "";
  return `${sign}${c.toFixed(1)}%`;
}

// Second scrolling strip, under the events Ticker — live market data, not
// editorial content, so it's visually distinct (own accent color) rather
// than mixed into the event feed. Data is fetched/polled by the parent
// (MapView) so layout height can be sized correctly alongside other layers.
export function CryptoTicker({ tickers }: { tickers: CryptoTickerData[] }) {
  if (!tickers.length) return null;
  const loop = [...tickers, ...tickers];

  return (
    <div className="ticker crypto-ticker">
      <div className="ticker-label crypto">
        <span className="live-dot" />
        Markets
      </div>
      <div className="ticker-scroll">
        {loop.map((t, i) => {
          const up = (t.change24h ?? 0) >= 0;
          return (
            <span key={`${t.id}-${i}`} className="ticker-item">
              <b>{t.symbol}</b> ${fmtPrice(t.price)}{" "}
              <span style={{ color: up ? "var(--faith)" : "var(--conflict)" }}>
                {fmtChange(t.change24h)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
