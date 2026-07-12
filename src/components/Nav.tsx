"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth, useTheme } from "./Providers";
import { AuthModal } from "./AuthModal";
import { GlobalSearch } from "./GlobalSearch";

function StarMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 6.1H20l-5 3.8 1.9 6.1L12 14.9 6.1 18l1.9-6.1-5-3.8h6.1z" />
    </svg>
  );
}

// Four primary workspaces (Overview / Live Map / Data & Statistics /
// AI Intelligence) plus Broadcast and Stories stay in the main nav.
// Chat, Dashboard, and Analytics move to the "More" menu below — real
// pages, still one click away, just not competing for primary attention.
const PRIMARY_LINKS = [
  { href: "/overview", label: "Overview" },
  { href: "/", label: "Live Map" },
  { href: "/data", label: "Data & Statistics" },
  { href: "/ai-intelligence", label: "AI Intelligence" },
  { href: "/broadcast", label: "Broadcast" },
  { href: "/stories", label: "Stories" },
  { href: "/holy-sites", label: "Holy sites" },
  { href: "/settings", label: "Settings" },
];

const MORE_LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/calendar", label: "Islamic Calendar" },
];

const MODERATION_LINK = { href: "/moderation", label: "Queue" };

function MoreMenu({ links, active }: { links: { href: string; label: string }[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="nav-more" ref={ref}>
      <button className={`nav-more-btn${active ? " active" : ""}`} onClick={() => setOpen((v) => !v)}>
        More ▾
      </button>
      {open && (
        <div className="nav-more-dropdown">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Nav({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const isModerator = user?.authRole === "moderator" || user?.authRole === "admin";

  const moreLinks = isModerator ? [...MORE_LINKS, MODERATION_LINK] : MORE_LINKS;
  const moreActive = moreLinks.some((l) => l.href === path);

  return (
    <nav className="nav">
      <Link href="/overview" className="brand" style={{ textDecoration: "none" }} title="Real-time insights across the Muslim world">
        <span className="mark"><StarMark /></span>
        <h1>UmmahMonitor</h1>
      </Link>
      <span className="live-dot" title="Live" />
      <div className="nav-links">
        {PRIMARY_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <MoreMenu links={moreLinks} active={moreActive} />
      </div>
      <GlobalSearch />
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
