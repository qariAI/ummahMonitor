"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type OnboardingChannels } from "@/components/Providers";
import { AuthModal } from "@/components/AuthModal";
import { CATEGORIES, type CategoryKey } from "@/lib/client";

/** Marks this browser as having seen onboarding, so a guest who skips or
 *  finishes without an account isn't redirected back here on every visit. */
function markOnboardingSeen() {
  document.cookie = "um_onboard_seen=1; path=/; max-age=31536000";
}

const ROLES = ["Researcher", "Journalist", "NGO worker", "Community leader", "Student", "Other"];

const CAT_META: Record<CategoryKey, { desc: string; count: number }> = {
  good_news: { desc: "Conversions, new masjids, milestones, hope", count: 29 },
  faith: { desc: "Worship, scholarship, pilgrimage, rulings", count: 84 },
  community: { desc: "Culture, diaspora, education, youth", count: 61 },
  humanitarian: { desc: "Relief, refugees, disaster response", count: 73 },
  conflict: { desc: "Security, ceasefires, displacement", count: 58 },
  economy: { desc: "Sukuk, halal trade, Islamic finance", count: 47 },
  education: { desc: "Scholarship, universities, manuscripts", count: 39 },
};

const REGIONS = [
  { key: "mena", label: "Middle East & N. Africa", flag: "🌍", count: 22 },
  { key: "africa", label: "Sub-Saharan Africa", flag: "🌍", count: 18 },
  { key: "southasia", label: "South Asia", flag: "🌏", count: 8 },
  { key: "seasia", label: "Southeast Asia", flag: "🌏", count: 11 },
  { key: "centralasia", label: "Central Asia", flag: "🌐", count: 5 },
  { key: "euramericas", label: "Europe & Americas", flag: "🌎", count: 14 },
  { key: "eastafrica", label: "East Africa", flag: "🌍", count: 6 },
] as const;
type RegionKey = (typeof REGIONS)[number]["key"];

const SEV_OPTS = [
  { key: "all", label: "All", icon: "🟢" },
  { key: "medium", label: "Medium+", icon: "🟡" },
  { key: "high", label: "High+", icon: "🟠" },
  { key: "critical", label: "Critical", icon: "🔴" },
] as const;

const DIGEST_OPTS = ["real-time", "hourly", "daily", "weekly"] as const;

const CHANNEL_DEFS = [
  { key: "inapp", icon: "💬", label: "In-app notifications", desc: "Banners and badge counts inside UmmahMonitor" },
  { key: "email", icon: "✉️", label: "Email digest", desc: "Delivered to your inbox on your chosen schedule" },
  { key: "whatsapp", icon: "📱", label: "WhatsApp alerts", desc: "Critical events sent via WhatsApp Business API" },
] as const;

const STEP_CONTEXT: {
  tag: string;
  title: string;
  tagline?: string;
  body: string;
  token: string;
  stats: { icon: string; val: string; label: string }[];
}[] = [
  {
    tag: "Welcome", title: "Intelligence built for the Ummah",
    tagline: "Trusted signals. Global perspective.",
    body: "From Makkah to Manitoba — monitor what matters to Muslim communities worldwide, in one place.",
    token: "--faith",
    stats: [{ icon: "🌍", val: "1.8B", label: "Muslims tracked" }, { icon: "📡", val: "340+", label: "live sources" }, { icon: "⚡", val: "<4min", label: "avg alert lag" }],
  },
  {
    tag: "Categories", title: "Your feed, your priorities",
    body: "Each category draws from dedicated source networks — toggle only what matters to your work.",
    token: "--community",
    stats: [{ icon: "🏷️", val: "7", label: "categories" }, { icon: "📰", val: "340+", label: "sources" }, { icon: "🔔", val: "Custom", label: "per-cat alerts" }],
  },
  {
    tag: "Regions", title: "Geography shapes everything",
    body: "The Muslim world spans 50+ countries across six continents. Narrow your field to reduce noise.",
    token: "--economy",
    stats: [{ icon: "🗺️", val: "57+", label: "OIC countries" }, { icon: "🔍", val: "City-level", label: "granularity" }, { icon: "🤝", val: "200+", label: "diaspora hubs" }],
  },
  {
    tag: "Alerts", title: "Stay informed without noise",
    body: "Critical alerts cut through immediately. Routine signals arrive in your digest at a pace you choose.",
    token: "--humanitarian",
    stats: [{ icon: "📲", val: "3", label: "channels" }, { icon: "⚙️", val: "Custom", label: "thresholds" }, { icon: "🤫", val: "No spam", label: "guaranteed" }],
  },
  {
    tag: "Ready", title: "You're live and ready to go.",
    body: "Your personalised dashboard is ready. The feed updates in real time — refresh anytime.",
    token: "--faith",
    stats: [{ icon: "✅", val: "Live", label: "feed active" }, { icon: "🛎️", val: "Alerts", label: "configured" }, { icon: "🔒", val: "Private", label: "by default" }],
  },
];

const SEV_LABEL: Record<string, string> = {
  all: "all severities", medium: "Medium and above", high: "High and Critical only", critical: "Critical only",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [cats, setCats] = useState<Record<CategoryKey, boolean>>({
    faith: true, community: false, humanitarian: true, conflict: true, economy: false, education: false, good_news: true,
  });
  const [regions, setRegions] = useState<Record<RegionKey, boolean>>({
    mena: true, africa: false, southasia: true, seasia: false, centralasia: false, euramericas: false, eastafrica: false,
  });
  const [severity, setSeverity] = useState<(typeof SEV_OPTS)[number]["key"]>("high");
  const [digest, setDigest] = useState<(typeof DIGEST_OPTS)[number]>("daily");
  const [channels, setChannels] = useState<OnboardingChannels>({ inapp: true, email: false, whatsapp: false });
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const ctx = STEP_CONTEXT[step - 1];
  const selectedCats = (Object.keys(cats) as CategoryKey[]).filter((k) => cats[k]);
  const selectedRegions = (Object.keys(regions) as RegionKey[]).filter((k) => regions[k]);

  async function persist(finalSeverity = severity, finalCats = selectedCats, finalRegions = selectedRegions) {
    // No local `if (!user)` gate here: a guest who just signed up inline on
    // step 5 already has a valid session cookie even though this render's
    // `user` value is still stale. The API enforces auth itself and this
    // call is a harmless no-op (401, caught below) for a true guest.
    setSaving(true);
    try {
      await completeOnboarding({
        role, categories: finalCats, regions: finalRegions, severity: finalSeverity, digest, channels,
      });
    } catch {
      // Non-fatal — user still proceeds to the dashboard with local state only.
    } finally {
      setSaving(false);
    }
  }

  function next() {
    setStep((s) => Math.min(5, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }
  async function skip() {
    // Skip collects nothing — clear local selections so the completion
    // screen's summary reflects that ("None selected" / "Worldwide"),
    // not whatever the step defaults happened to be.
    setCats({ faith: false, community: false, humanitarian: false, conflict: false, economy: false, education: false, good_news: false });
    setRegions({ mena: false, africa: false, southasia: false, seasia: false, centralasia: false, euramericas: false, eastafrica: false });
    setSeverity("high");
    await persist("high", [], []);
    setStep(5);
  }
  async function finish() {
    await persist();
    setStep(5);
  }
  async function launch() {
    markOnboardingSeen();
    router.push("/");
  }
  async function onGuestAuthed() {
    await persist();
    markOnboardingSeen();
    router.push("/");
  }

  const firstName = name.trim() ? name.trim().split(" ")[0] : "friend";
  const catNames = selectedCats.map((k) => CATEGORIES[k].label);
  const regionNames = selectedRegions.map((k) => REGIONS.find((r) => r.key === k)?.label ?? k);
  const activeChannelCount = Object.values(channels).filter(Boolean).length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left brand panel */}
      <div
        style={{
          width: 420, flex: "none", position: "relative", overflow: "hidden",
          borderRight: "1px solid var(--stroke)", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "44px 40px",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(110% 90% at 15% -10%, color-mix(in srgb, var(${ctx.token}) 14%, transparent), transparent 60%)`,
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 16.6,9.8 24.9,9.8 18.2,14.9 20.7,22.7 14,17.6 7.3,22.7 9.8,14.9 3.1,9.8 11.4,9.8" fill="var(--faith)" opacity={0.92} />
          </svg>
          <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700 }}>
            Ummah<em style={{ fontStyle: "normal", color: "var(--faith)" }}>Monitor</em>
          </span>
        </div>

        <div key={step} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 0 30px" }}>
          <div
            className="mono"
            style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: `var(${ctx.token})`, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(${ctx.token})`, display: "block", flex: "none" }} />
            {ctx.tag}
          </div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 36, lineHeight: 1.18, fontWeight: 700, marginBottom: 16 }}>{ctx.title}</h2>
          {ctx.tagline && (
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", color: `var(${ctx.token})`, marginBottom: 10 }}>
              {ctx.tagline}
            </p>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.72, color: "var(--muted)", maxWidth: 320 }}>{ctx.body}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32 }}>
            {ctx.stats.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 99, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                <div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                height: 3, borderRadius: 2, flex: "none", transition: "all .35s",
                width: n <= step ? (n === step ? 40 : 24) : 16,
                background: n <= step ? "var(--faith)" : "var(--stroke2)",
              }}
            />
          ))}
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)", marginLeft: 6 }}>{step} / 5</span>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {step === 1 && (
            <div>
              <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 18 }}>Step 1 — Get started</div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 38, fontWeight: 700, lineHeight: 1.14, marginBottom: 12 }}>What matters<br />to your Ummah?</h1>
              <p style={{ fontSize: 15, lineHeight: 1.72, color: "var(--muted)", marginBottom: 36, maxWidth: 440 }}>
                UmmahMonitor tracks events, crises, and opportunities across the global Muslim community. Set up your feed in under two minutes.
              </p>

              <div className="field">
                <label>Your name or organisation</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fatima Al-Rashid" autoFocus />
              </div>
              <div className="field" style={{ marginBottom: 32 }}>
                <label>Role</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      className="chip"
                      style={role === r ? { borderColor: "var(--faith)", background: "color-mix(in srgb, var(--faith) 12%, transparent)", color: "var(--faith)" } : undefined}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-primary" onClick={next}>Begin setup →</button>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button style={{ fontSize: 13, color: "var(--faint)" }} onClick={skip} disabled={saving}>
                  Skip setup, explore as guest
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 18 }}>Step 2 — Focus areas</div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 700, lineHeight: 1.18, marginBottom: 10 }}>Which streams<br />do you monitor?</h1>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)", marginBottom: 28 }}>
                Select one or more. Your feed, alerts and country scores will weight these categories.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
                {(Object.keys(CATEGORIES) as CategoryKey[]).map((k) => {
                  const on = cats[k];
                  const tok = CATEGORIES[k].token;
                  return (
                    <button
                      key={k}
                      onClick={() => setCats((s) => ({ ...s, [k]: !s[k] }))}
                      style={{
                        display: "flex", flexDirection: "column", gap: 10, padding: "16px 14px", borderRadius: 13,
                        border: `1.5px solid ${on ? `var(${tok})` : "var(--stroke)"}`,
                        background: on ? `color-mix(in srgb, var(${tok}) 7%, transparent)` : "var(--bg2)",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{ width: 9, height: 9, borderRadius: "50%", background: `var(${tok})` }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: on ? `var(${tok})` : "var(--text)" }}>{CATEGORIES[k].label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.45 }}>{CAT_META[k].desc}</div>
                      </div>
                      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 10, color: "var(--faint)" }}>{CAT_META[k].count} sources</span>
                        <div
                          style={{
                            width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", flex: "none",
                            border: `1.5px solid ${on ? `var(${tok})` : "var(--stroke2)"}`,
                            background: on ? `color-mix(in srgb, var(${tok}) 16%, transparent)` : "transparent",
                          }}
                        >
                          {on && <span style={{ fontSize: 11, color: `var(${tok})` }}>✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" onClick={prev}>← Back</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={next}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 18 }}>Step 3 — Geography</div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 700, lineHeight: 1.18, marginBottom: 10 }}>Where in the<br />Muslim world?</h1>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)", marginBottom: 28 }}>
                Pick regions to prioritise. You can always refine per-country later.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
                {REGIONS.map((r) => {
                  const on = regions[r.key];
                  return (
                    <button
                      key={r.key}
                      onClick={() => setRegions((s) => ({ ...s, [r.key]: !s[r.key] }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: 12,
                        border: `1.5px solid ${on ? "var(--faith)" : "var(--stroke)"}`,
                        background: on ? "color-mix(in srgb, var(--faith) 7%, transparent)" : "var(--bg2)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 24, flex: "none", lineHeight: 1 }}>{r.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: on ? "var(--faith)" : "var(--text)" }}>{r.label}</div>
                        <div className="mono" style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>{r.count} countries</div>
                      </div>
                      <div
                        style={{
                          width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none",
                          border: `1.5px solid ${on ? "var(--faith)" : "var(--stroke2)"}`,
                          background: on ? "color-mix(in srgb, var(--faith) 16%, transparent)" : "transparent",
                        }}
                      >
                        {on && <span style={{ fontSize: 11, color: "var(--faith)" }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" onClick={prev}>← Back</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={next}>Continue →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 18 }}>Step 4 — Alerts</div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 700, lineHeight: 1.18, marginBottom: 10 }}>How should we<br />reach you?</h1>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)", marginBottom: 28 }}>
                Set your minimum severity threshold. You can fine-tune per-category later.
              </p>

              <div style={{ marginBottom: 24 }}>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 12 }}>Minimum severity</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {SEV_OPTS.map((s) => {
                    const on = severity === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSeverity(s.key)}
                        style={{
                          flex: 1, height: 52, borderRadius: 11, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 3,
                          border: `1.5px solid ${on ? "var(--stroke2)" : "var(--stroke)"}`,
                          background: on ? "var(--bg2)" : "transparent",
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{s.icon}</span>
                        <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: on ? "var(--text)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 12 }}>Digest frequency</div>
                <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 11, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                  {DIGEST_OPTS.map((d) => {
                    const on = digest === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDigest(d)}
                        style={{
                          flex: 1, height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                          color: on ? "var(--text)" : "var(--muted)", background: on ? "var(--panel-solid)" : "transparent",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 12 }}>Notification channels</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CHANNEL_DEFS.map((c) => {
                    const on = channels[c.key as keyof OnboardingChannels];
                    return (
                      <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 11, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                        <span style={{ fontSize: 18, flex: "none" }}>{c.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.desc}</div>
                        </div>
                        <button
                          onClick={() => setChannels((s) => ({ ...s, [c.key]: !s[c.key as keyof OnboardingChannels] }))}
                          style={{
                            width: 38, height: 22, borderRadius: 99, position: "relative", flex: "none",
                            background: on ? "color-mix(in srgb, var(--faith) 55%, transparent)" : "var(--dot)",
                          }}
                        >
                          <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", display: "block" }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" onClick={prev}>← Back</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={finish} disabled={saving}>
                  {saving ? "…" : "Finish setup →"}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px", display: "grid", placeItems: "center",
                  background: "color-mix(in srgb, var(--faith) 16%, transparent)",
                  border: "1.5px solid color-mix(in srgb, var(--faith) 36%, transparent)",
                  animation: "scale-pulse 2.2s ease infinite",
                }}
              >
                <span style={{ fontSize: 27, color: "var(--faith)" }}>✓</span>
              </div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 38, fontWeight: 700, lineHeight: 1.18, marginBottom: 12 }}>
                You're all set,<br />{firstName}
              </h1>
              <p style={{ fontSize: 14, lineHeight: 1.72, color: "var(--muted)", marginBottom: 36 }}>
                Your personalised feed is ready. Here's what we'll be watching for you:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "color-mix(in srgb, var(--faith) 14%, transparent)", display: "grid", placeItems: "center", flex: "none", color: "var(--faith)" }}>◈</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {selectedCats.length} categor{selectedCats.length === 1 ? "y" : "ies"} monitored
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{catNames.length ? catNames.join(", ") : "None selected"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "color-mix(in srgb, var(--community) 14%, transparent)", display: "grid", placeItems: "center", flex: "none", color: "var(--community)" }}>◎</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {selectedRegions.length} region{selectedRegions.length === 1 ? "" : "s"} in scope
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {regionNames.length ? regionNames.slice(0, 3).join(", ") + (regionNames.length > 3 ? ` +${regionNames.length - 3} more` : "") : "Worldwide"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--bg2)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "color-mix(in srgb, var(--humanitarian) 14%, transparent)", display: "grid", placeItems: "center", flex: "none", color: "var(--humanitarian)" }}>▲</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Alerts: {SEV_LABEL[severity] ?? severity}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {digest.charAt(0).toUpperCase() + digest.slice(1)} digest · {activeChannelCount} channel{activeChannelCount !== 1 ? "s" : ""} active
                    </div>
                  </div>
                </div>
              </div>

              {user ? (
                <button className="btn-primary" onClick={launch} disabled={saving}>Enter dashboard →</button>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => setAuthOpen(true)}>
                    Create free account to save this setup →
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ width: "100%", marginTop: 10 }}
                    onClick={launch}
                  >
                    Enter dashboard as guest
                  </button>
                </>
              )}
              <div style={{ marginTop: 14 }}>
                <button style={{ fontSize: 13, color: "var(--faint)" }} onClick={prev}>← Edit preferences</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          defaultTab="signup"
          redirectAfterSignup={null}
          onAuthed={onGuestAuthed}
        />
      )}
    </div>
  );
}
