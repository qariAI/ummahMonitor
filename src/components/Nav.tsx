"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth, useTheme } from "./Providers";
import { AuthModal } from "./AuthModal";

function StarMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 6.1H20l-5 3.8 1.9 6.1L12 14.9 6.1 18l1.9-6.1-5-3.8h6.1z" />
    </svg>
  );
}

const BASE_LINKS = [
  { href: "/", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/holy-sites", label: "Holy sites" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

const MODERATION_LINK = { href: "/moderation", label: "Queue" };

export function Nav({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const isModerator = user?.authRole === "moderator" || user?.authRole === "admin";
  // Insert the moderator-only Queue link right before Settings, whatever
  // else is in BASE_LINKS — avoids hardcoded indices silently dropping
  // links whenever BASE_LINKS changes.
  const LINKS = isModerator
    ? [...BASE_LINKS.slice(0, -1), MODERATION_LINK, BASE_LINKS[BASE_LINKS.length - 1]]
    : BASE_LINKS;

  return (
    <nav className="nav">
      <Link href="/" className="brand" style={{ textDecoration: "none" }} title="Real-time insights across the Muslim world">
        <span className="mark"><StarMark /></span>
        <h1>UmmahMonitor</h1>
      </Link>
      <span className="live-dot" title="Live" />
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>
      <span className="nav-spacer" />
      {children}
      <button className="icon-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
        {theme === "dark" ? "☾" : "☀"}
      </button>
      {user ? (
        <button
          className="avatar"
          title={`${user.name} — sign out`}
          onClick={() => logout()}
        >
          {user.name.slice(0, 1).toUpperCase()}
        </button>
      ) : (
        <button className="pill-btn" onClick={() => setAuthOpen(true)}>
          Sign in
        </button>
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </nav>
  );
}
