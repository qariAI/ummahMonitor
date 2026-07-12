"use client";

import { Nav } from "@/components/Nav";
import { getIslamicCalendarInfo, getMoonPhase, HIJRI_MONTH_NAMES } from "@/lib/hijri";

function CountdownCard({ icon, label, days, active }: { icon: string; label: string; days: number; active?: boolean }) {
  return (
    <div className="ip-panel" style={active ? { borderColor: "color-mix(in srgb, var(--faith) 45%, var(--stroke))", background: "color-mix(in srgb, var(--faith) 6%, var(--panel-solid))" } : undefined}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: active ? "var(--faith)" : "var(--text)" }}>
        {active ? "Today" : days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const info = getIslamicCalendarInfo();
  const moon = getMoonPhase();

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Islamic Calendar</div>
          <h1>{HIJRI_MONTH_NAMES[info.hijriToday.month - 1]} {info.hijriToday.day}, {info.hijriToday.year} AH</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
            Computed live from the Umm al-Qura calendar — recalculated every visit, never a hardcoded date table.
          </p>
        </div>

        <div className="ip-grid-3" style={{ marginBottom: 16 }}>
          <div className="ip-panel">
            <div style={{ fontSize: 40, marginBottom: 6 }}>{moon.emoji}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 4 }}>Moon phase</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{moon.name}</div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>{moon.ageDays.toFixed(1)} days into the lunar cycle</div>
          </div>
          <CountdownCard icon="🌙" label="Ramadan" days={info.daysUntilRamadan} active={info.isRamadanNow} />
          <CountdownCard icon="🕌" label="Eid al-Fitr" days={info.daysUntilEidAlFitr} />
        </div>

        <div className="ip-grid-3" style={{ marginBottom: 16 }}>
          <CountdownCard icon="🕋" label="Hajj — Day of Arafah" days={info.daysUntilHajjDay} active={info.isHajjSeasonNow} />
          <CountdownCard icon="🐑" label="Eid al-Adha" days={info.daysUntilEidAlAdha} />
          <CountdownCard icon="🖤" label="Ashura" days={info.daysUntilAshura} />
        </div>

        <div className="ip-panel">
          <div className="ip-hd">📅 THE HIJRI YEAR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {HIJRI_MONTH_NAMES.map((name, i) => {
              const isCurrent = i + 1 === info.hijriToday.month;
              return (
                <div
                  key={name}
                  style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: isCurrent ? "color-mix(in srgb, var(--faith) 14%, transparent)" : "var(--bg2)",
                    border: isCurrent ? "1px solid color-mix(in srgb, var(--faith) 40%, transparent)" : "1px solid var(--stroke)",
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--faint)", fontFamily: "var(--mono)" }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: isCurrent ? "var(--faith)" : "var(--text)", fontWeight: isCurrent ? 700 : 500 }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
