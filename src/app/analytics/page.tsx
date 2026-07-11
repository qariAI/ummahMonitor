import { listEvents, listCountries } from "@/lib/repos";
import { Nav } from "@/components/Nav";
import { CATEGORIES } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);

  const cats = Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[];
  const byCat = cats.map((c) => ({
    key: c,
    label: CATEGORIES[c].label,
    token: CATEGORIES[c].token,
    count: events.filter((e) => e.category === c).length,
  }));
  const maxCount = Math.max(1, ...byCat.map((b) => b.count));
  const total = events.length || 1;

  // Donut (category share)
  let acc = 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const arcs = byCat
    .filter((b) => b.count > 0)
    .map((b) => {
      const frac = b.count / total;
      const seg = { token: b.token, len: frac * C, offset: -acc * C, label: b.label, count: b.count };
      acc += frac;
      return seg;
    });

  const movers = [...countries].sort((a, b) => b.score - a.score).slice(0, 6);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Trends</div>
          <h1>Analytics</h1>
        </div>
        <div className="card-grid">
          <div className="card">
            <h3>Event volume by category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byCat.map((b) => (
                <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 92, fontSize: 12, color: "var(--muted)" }}>{b.label}</span>
                  <div style={{ flex: 1, height: 10, background: "var(--dot)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(b.count / maxCount) * 100}%`, height: "100%", background: `var(${b.token})`, borderRadius: 6 }} />
                  </div>
                  <span className="mono" style={{ width: 22, textAlign: "right", fontSize: 12, color: "var(--muted)" }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Category share</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <g transform="translate(65,65) rotate(-90)">
                  <circle r={R} fill="none" stroke="var(--dot)" strokeWidth="16" />
                  {arcs.map((a, i) => (
                    <circle
                      key={i}
                      r={R}
                      fill="none"
                      stroke={`var(${a.token})`}
                      strokeWidth="16"
                      strokeDasharray={`${a.len} ${C - a.len}`}
                      strokeDashoffset={a.offset}
                    />
                  ))}
                </g>
                <text x="65" y="60" textAnchor="middle" fontFamily="var(--mono)" fontSize="22" fontWeight="600" fill="var(--text)">{events.length}</text>
                <text x="65" y="76" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">EVENTS</text>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {byCat.filter((b) => b.count > 0).map((b) => (
                  <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: `var(${b.token})` }} />
                    {b.label} <span className="mono" style={{ color: "var(--faint)" }}>{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Top movers · situation index</h3>
            {movers.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ flex: 1, fontSize: 12.5 }}>{c.name}</span>
                <span className={`tr ${c.trend}`} style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {c.trend === "up" ? "▲" : c.trend === "down" ? "▼" : "→"}
                </span>
                <span className="mono" style={{ width: 28, textAlign: "right", fontSize: 12.5, fontWeight: 600 }}>{c.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
