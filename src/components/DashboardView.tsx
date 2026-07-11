"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthModal } from "@/components/AuthModal";
import { useAuth, useToast } from "@/components/Providers";
import { api, CATEGORIES, ago, severityToken } from "@/lib/client";
import type { EventDTO } from "@/lib/repos";

function EventRow({ e }: { e: EventDTO }) {
  return (
    <Link
      href={`/?event=${e.id}`}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", textDecoration: "none", borderBottom: "1px solid var(--stroke)" }}
    >
      <span className="cdot" style={{ background: `var(${CATEGORIES[e.category].token})` }} />
      <span style={{ flex: 1, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
      <span
        className="sev"
        style={{ background: `color-mix(in srgb, var(${severityToken(e.severity)}) 18%, transparent)`, color: `var(${severityToken(e.severity)})` }}
      >
        {e.severity}
      </span>
      <span className="mono" style={{ color: "var(--faint)", fontSize: 10.5 }}>{ago(e.timestamp)}</span>
    </Link>
  );
}

export function DashboardView() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [saved, setSaved] = useState<EventDTO[] | null>(null);
  const [followedCountries, setFollowedCountries] = useState<string[]>([]);
  const [followedEvents, setFollowedEvents] = useState<EventDTO[]>([]);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    async function load() {
      try {
        const [savedRes, followsRes, eventsRes] = await Promise.all([
          api<{ events: EventDTO[] }>("/api/saved-events"),
          api<{ countries: string[] }>("/api/follows/countries"),
          api<{ events: EventDTO[] }>("/api/events"),
        ]);
        if (!alive) return;
        setSaved(savedRes.events);
        setFollowedCountries(followsRes.countries);
        setFollowedEvents(eventsRes.events.filter((e) => followsRes.countries.includes(e.country)));
      } catch {
        toast("Couldn't load your dashboard — try refreshing");
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [user]);

  async function unfollow(country: string) {
    try {
      const r = await api<{ countries: string[] }>("/api/follows/countries", {
        method: "DELETE",
        body: JSON.stringify({ country }),
      });
      setFollowedCountries(r.countries);
      setFollowedEvents((prev) => prev.filter((e) => e.country !== country));
      toast(`Unfollowed ${country}`);
    } catch {
      toast("Something went wrong — try again");
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Nav />
        <div className="page">
          <div className="page-hd">
            <div className="eyebrow">Dashboard</div>
            <h1>Your personalised view</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
              Sign in to save events, follow countries, and see it all in one place.
            </p>
          </div>
          <button className="chip" style={{ borderColor: "var(--stroke2)", background: "var(--bg2)", color: "var(--text)" }} onClick={() => setAuthOpen(true)}>
            Sign in
          </button>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} redirectAfterSignup={null} />}
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Dashboard</div>
          <h1>Welcome back{user.name ? `, ${user.name}` : ""}</h1>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Saved events {saved ? `· ${saved.length}` : ""}</h3>
            {saved === null && <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>}
            {saved?.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Nothing saved yet — tap ☆ on any event's dossier to keep it here.
              </p>
            )}
            {saved?.map((e) => <EventRow key={e.id} e={e} />)}
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Followed countries {followedCountries.length > 0 ? `· ${followedCountries.length}` : ""}</h3>
            {followedCountries.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Not following any countries yet — visit a country's page and tap "+ Follow".
              </p>
            )}
            {followedCountries.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {followedCountries.map((c) => (
                  <span
                    key={c}
                    className="chip"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "var(--stroke2)" }}
                  >
                    <Link href={`/country/${encodeURIComponent(c)}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                      {c}
                    </Link>
                    <button onClick={() => unfollow(c)} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", padding: 0 }} title={`Unfollow ${c}`}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Recent activity
            </div>
            {followedCountries.length > 0 && followedEvents.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No recent public events in your followed countries.</p>
            )}
            {followedEvents.map((e) => <EventRow key={e.id} e={e} />)}
          </div>
        </div>

        <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "var(--faith)", fontSize: 13 }}>
          ← Back to map
        </Link>
      </div>
    </>
  );
}
