import { listEvents } from "@/lib/repos";
import { CATEGORIES, ago, severityToken } from "@/lib/client";

export const dynamic = "force-dynamic";

// Mobile companion — bottom-nav alerts feed, not a scaled desktop layout.
export default async function MobilePage() {
  const events = await listEvents({ publicOnly: true });
  const alerts = events.slice(0, 12);
  const unread = alerts.filter((_, i) => i < 4).length;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--stroke)", position: "sticky", top: 0, background: "var(--panel)", backdropFilter: "blur(10px)", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 20, margin: 0 }}>Your Alerts</h1>
          {unread > 0 && (
            <span className="badge" style={{ background: "color-mix(in srgb,var(--conflict) 18%,transparent)", color: "var(--conflict)" }}>
              {unread} new
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px 90px" }}>
        {alerts.map((e, i) => (
          <div
            key={e.id}
            style={{
              display: "flex", gap: 11, padding: "13px 8px", borderBottom: "1px solid var(--stroke)",
              opacity: i < unread ? 1 : 0.72,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: `var(${CATEGORIES[e.category].token})`, marginTop: 5, flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{e.title}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  className="sev"
                  style={{ background: `color-mix(in srgb, var(${severityToken(e.severity)}) 18%, transparent)`, color: `var(${severityToken(e.severity)})` }}
                >
                  {e.severity}
                </span>
                <span>{e.country}</span>
                <span>· {ago(e.timestamp)}</span>
              </div>
            </div>
            {i < unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--community)", marginTop: 6, flex: "none" }} />}
          </div>
        ))}
      </div>

      <nav
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420,
          display: "flex", borderTop: "1px solid var(--stroke)", background: "var(--panel-solid)", height: 60,
        }}
      >
        {["Map", "Feed", "Alerts", "You"].map((l, i) => (
          <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: i === 2 ? "var(--faith)" : "var(--muted)", fontSize: 10.5, fontWeight: 600 }}>
            <span style={{ fontSize: 16 }}>{["🗺️", "📰", "🔔", "👤"][i]}</span>
            {l}
          </div>
        ))}
      </nav>
    </div>
  );
}
