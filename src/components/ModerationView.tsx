"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModerationDTO } from "@/lib/repos";
import { CATEGORIES, ago, api, severityIcon, severityToken, trustScoreToken, type CategoryKey } from "@/lib/client";
import { Nav } from "./Nav";
import { useAuth, useToast } from "./Providers";
import { AuthModal } from "./AuthModal";

type StatusTab = "pending" | "flagged" | "approved" | "rejected";
type Sort = "severity" | "trust" | "recent";

export function ModerationView() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<StatusTab>("pending");
  const [sort, setSort] = useState<Sort>("recent");
  const [items, setItems] = useState<ModerationDTO[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selId, setSelId] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const r = await api<{ items: ModerationDTO[]; counts: Record<string, number> }>(
      `/api/moderation?status=${tab}&sort=${sort}`,
    );
    setItems(r.items);
    setCounts(r.counts);
    setSelId((prev) => (r.items.some((i) => i.id === prev) ? prev : r.items[0]?.id ?? null));
  }, [user, tab, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const sel = items.find((i) => i.id === selId) ?? null;

  async function decide(id: number, decision: StatusTab extends never ? never : "approved" | "rejected" | "flagged") {
    await api(`/api/moderation/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    toast(`Item ${decision}`, undefined);
    await load();
  }

  async function autoApprove() {
    const { approved } = await api<{ approved: number }>("/api/moderation/auto-approve", { method: "POST" });
    toast(`Auto-approved ${approved} verified item${approved === 1 ? "" : "s"} (≥85 trust)`);
    await load();
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="page"><p style={{ color: "var(--muted)" }}>Loading…</p></div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Nav />
        <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
          <h1 style={{ fontFamily: "var(--display)" }}>Moderation Queue</h1>
          <p style={{ color: "var(--muted)", margin: "10px 0 22px" }}>
            Reviewer access required — sign in to review community submissions.
          </p>
          <button className="btn-primary" style={{ maxWidth: 240, margin: "0 auto" }} onClick={() => setAuthOpen(true)}>
            Sign in to continue
          </button>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </>
    );
  }

  const TABS: StatusTab[] = ["pending", "flagged", "approved", "rejected"];

  return (
    <>
      <Nav>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {counts.pending ?? 0} pending
        </span>
        <button className="pill-btn" onClick={autoApprove}>⚡ Auto-approve verified</button>
      </Nav>

      <div style={{ display: "flex", height: "calc(100vh - 54px)" }}>
        {/* Queue list */}
        <div style={{ width: 404, borderRight: "1px solid var(--stroke)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 4, padding: 10, borderBottom: "1px solid var(--stroke)" }}>
            {TABS.map((t) => (
              <button
                key={t}
                className="chip"
                style={tab === t ? { borderColor: "var(--stroke2)", background: "var(--bg2)", color: "var(--text)" } : undefined}
                onClick={() => setTab(t)}
              >
                {t} {counts[t] != null && <span className="mono" style={{ color: "var(--faint)" }}>{counts[t]}</span>}
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              style={{ marginLeft: "auto", background: "var(--bg2)", border: "1px solid var(--stroke)", borderRadius: 7, fontSize: 11, padding: "0 6px" }}
            >
              <option value="recent">Recent</option>
              <option value="severity">Severity</option>
              <option value="trust">Trust</option>
            </select>
          </div>
          <div style={{ overflowY: "auto", padding: 8 }}>
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => setSelId(it.id)}
                className="card"
                style={{
                  padding: 13, marginBottom: 8, cursor: "pointer",
                  borderColor: it.id === selId ? "var(--stroke2)" : "var(--stroke)",
                  background: it.id === selId ? "var(--bg2)" : "var(--panel-solid)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                  <span className="cdot" style={{ width: 8, height: 8, borderRadius: "50%", background: `var(${CATEGORIES[it.category].token})` }} />
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{it.country}</span>
                  <span className="sev" style={{ marginLeft: "auto", background: `color-mix(in srgb, var(${severityToken(it.severity)}) 18%, transparent)`, color: `var(${severityToken(it.severity)})` }}>
                    {severityIcon(it.severity)} {it.severity}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>{it.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: `color-mix(in srgb, var(${trustScoreToken(it.trustScore)}) 15%, transparent)`, color: `var(${trustScoreToken(it.trustScore)})` }}>
                    {it.trustScore}/100
                  </span>
                  {/* Publish-threshold pill — SAME shared service as the public dossier */}
                  <span className="badge" style={{ background: `color-mix(in srgb, var(${it.publish.token}) 15%, transparent)`, color: `var(${it.publish.token})` }}>
                    {it.publish.label}
                  </span>
                  <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--faint)" }}>{ago(it.submittedAt)}</span>
                </div>
              </div>
            ))}
            {items.length === 0 && <p style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>Nothing in {tab}.</p>}
          </div>
        </div>

        {/* Detail pane */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {sel ? (
            <div style={{ padding: "22px 26px 90px", maxWidth: 720 }}>
              <div className="dt-top">
                <span className="cat-dot" style={{ background: `var(${CATEGORIES[sel.category].token})` }} />
                {CATEGORIES[sel.category].label} · {sel.country}
                <span className="sev" style={{ background: `color-mix(in srgb, var(${severityToken(sel.severity)}) 18%, transparent)`, color: `var(${severityToken(sel.severity)})` }}>{severityIcon(sel.severity)} {sel.severity}</span>
              </div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 24, margin: "10px 0 4px" }}>{sel.title}</h2>
              <div className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                Submitted by {sel.submitter} · {ago(sel.submittedAt)}
              </div>

              {/* AI Trust Assessment */}
              <div className="sect">
                <h4>AI Trust Assessment</h4>
                <div
                  className="conf-box"
                  style={{ borderColor: `color-mix(in srgb, var(${sel.publish.token}) 26%, transparent)`, background: `color-mix(in srgb, var(${sel.publish.token}) 6%, transparent)` }}
                >
                  <div className="conf-top">
                    <div className="conf-num" style={{ color: `var(${sel.publish.token})` }}>
                      {sel.trustScore}<small>/100 confidence</small>
                    </div>
                    <span className="conf-pill" style={{ background: `color-mix(in srgb, var(${sel.publish.token}) 16%, transparent)`, color: `var(${sel.publish.token})` }}>
                      {sel.publish.label}
                    </span>
                  </div>
                  <div className="conf-note">{sel.publish.note}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  {sel.checks.map((c, i) => (
                    <div key={i} className="card" style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ color: c.ok ? "var(--faith)" : "var(--conflict)", fontWeight: 700 }}>{c.ok ? "✓" : "✕"}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{c.detail}</div>
                    </div>
                  ))}
                </div>

                <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}>{sel.aiVerdict}</p>
              </div>

              <div className="sect">
                <h4>Report body</h4>
                <p>{sel.body}</p>
              </div>

              <div className="sect">
                <h4>Corroborating sources</h4>
                {sel.sources.map((s, i) => (
                  <div className="crow2" key={i}>
                    <div className="ci2">{s.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}</div>
                    <div className="cnm"><div className="nm">{s.name}</div></div>
                    <span className="cst" style={{ color: s.verified ? "var(--faith)" : "var(--humanitarian)" }}>{s.verified ? "✓" : "◐"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ padding: 40, color: "var(--muted)" }}>Select an item to review.</p>
          )}

          {/* Action bar */}
          {sel && (
            <div style={{ position: "sticky", bottom: 0, display: "flex", gap: 10, padding: "14px 26px", borderTop: "1px solid var(--stroke)", background: "var(--panel)", backdropFilter: "blur(10px)" }}>
              <button className="btn-ghost" onClick={() => decide(sel.id, "flagged")}>🚩 Flag</button>
              <span style={{ flex: 1 }} />
              <button className="btn-ghost" onClick={() => decide(sel.id, "rejected")} style={{ borderColor: "color-mix(in srgb,var(--conflict) 40%,transparent)", color: "var(--conflict)" }}>Reject</button>
              <button className="btn-primary" style={{ width: "auto", padding: "0 22px", height: 44 }} onClick={() => decide(sel.id, "approved")}>
                Approve &amp; publish
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
