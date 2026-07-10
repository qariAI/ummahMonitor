"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SOURCE_DIRECTORY, TIER_META } from "@/lib/confidence";
import { CATEGORIES } from "@/lib/client";

const TABS = ["Source Directory", "Team & Roles", "Integrations", "API Access", "Notifications"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Source Directory");
  const sources = Object.entries(SOURCE_DIRECTORY);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Admin</div>
          <h1>Settings</h1>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t} className="chip" style={tab === t ? { borderColor: "var(--stroke2)", background: "var(--bg2)", color: "var(--text)" } : undefined} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Source Directory" && (
          <div className="card">
            <h3>{sources.length} ingested sources · {sources.length} active</h3>
            {sources.map(([name, tier]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--stroke)" }}>
                <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
                <span className="badge" style={{ background: `color-mix(in srgb, var(${TIER_META[tier].token}) 15%, transparent)`, color: `var(${TIER_META[tier].token})` }}>
                  {TIER_META[tier].label} · w{TIER_META[tier].weight}
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--faith)" }}>● active</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Team & Roles" && (
          <div className="card">
            <h3>Team members</h3>
            {[["Aisha Rahman", "Owner"], ["Yusuf Adeyemi", "Moderator"], ["Fatima Zahra", "Analyst"]].map(([n, r]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--stroke)" }}>
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{n.slice(0, 1)}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{n}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{r}</span>
              </div>
            ))}
            <button className="btn-ghost" style={{ marginTop: 14, height: 38 }}>+ Invite member</button>
          </div>
        )}

        {tab === "Integrations" && (
          <div className="card-grid">
            {["Slack", "Email digest", "Webhook", "PagerDuty"].map((i) => (
              <div key={i} className="card">
                <h3>{i}</h3>
                <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Push critical alerts and daily pulse to {i}.</p>
                <button className="btn-ghost" style={{ marginTop: 12, height: 36 }}>Connect</button>
              </div>
            ))}
          </div>
        )}

        {tab === "API Access" && (
          <div className="card">
            <h3>API Access</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
              Query the live event stream and country indices programmatically. Endpoints:
              <code style={{ display: "block", marginTop: 10, fontFamily: "var(--mono)", fontSize: 12, color: "var(--faith)" }}>
                GET /api/events · GET /api/countries · GET /api/events/:id
              </code>
            </p>
            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <code className="mono" style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>um_live_••••••••••••3f9a</code>
              <button className="btn-ghost" style={{ height: 40 }}>Regenerate</button>
            </div>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="card">
            <h3>Per-category rules</h3>
            {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--stroke)" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: `var(${CATEGORIES[c].token})` }} />
                <span style={{ flex: 1, fontSize: 13 }}>{CATEGORIES[c].label}</span>
                <select style={{ background: "var(--bg2)", border: "1px solid var(--stroke)", borderRadius: 7, fontSize: 12, padding: "4px 8px" }} defaultValue="high">
                  <option value="all">All</option>
                  <option value="medium">Medium+</option>
                  <option value="high">High+</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>
            ))}
            <p className="ai-fallback" style={{ marginTop: 12 }}>Critical alerts always override quiet hours.</p>
            <Link href="/onboarding" className="btn-ghost" style={{ marginTop: 14, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              Re-run setup
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
