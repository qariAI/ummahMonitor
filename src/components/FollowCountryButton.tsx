"use client";

import { useEffect, useState } from "react";
import { useAuth, useToast } from "./Providers";
import { api } from "@/lib/client";

export function FollowCountryButton({ country }: { country: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    api<{ countries: string[] }>("/api/follows/countries")
      .then((r) => alive && setFollowing(r.countries.includes(country)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, country]);

  async function toggle() {
    if (!user) {
      toast("Sign in to follow countries");
      return;
    }
    setLoading(true);
    try {
      if (following) {
        await api("/api/follows/countries", { method: "DELETE", body: JSON.stringify({ country }) });
        setFollowing(false);
        toast(`Unfollowed ${country}`);
      } else {
        await api("/api/follows/countries", { method: "POST", body: JSON.stringify({ country }) });
        setFollowing(true);
        toast(`Following ${country} — see it on your dashboard`);
      }
    } catch {
      toast("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
        border: `1px solid ${following ? "var(--faith)" : "var(--stroke)"}`,
        background: following ? "color-mix(in srgb, var(--faith) 14%, transparent)" : "transparent",
        color: following ? "var(--faith)" : "var(--muted)",
        fontSize: 13, cursor: "pointer",
      }}
    >
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}
