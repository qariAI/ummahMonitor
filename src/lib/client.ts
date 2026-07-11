// Client-side API helpers and small formatting utilities shared by screens.

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body.data as T;
}

export const CATEGORIES = {
  good_news: { label: "Good News", token: "--good-news" },
  faith: { label: "Faith", token: "--faith" },
  community: { label: "Community", token: "--community" },
  humanitarian: { label: "Humanitarian", token: "--humanitarian" },
  conflict: { label: "Conflict", token: "--conflict" },
  economy: { label: "Economy", token: "--economy" },
  education: { label: "Education", token: "--education" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/** Resolve a CSS var token (e.g. "--faith") to its computed hex at runtime.
 *  Needed because canvas 2D contexts cannot parse var()/color-mix(). */
export function resolveVar(token: string): string {
  if (typeof window === "undefined") return "#888";
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return v || "#888";
}

export function ago(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Status/severity → accent token, kept in one place. */
export function severityToken(sev: string): string {
  return sev === "critical" || sev === "high"
    ? "--conflict"
    : sev === "medium"
      ? "--humanitarian"
      : "--faith";
}

/** Severity → colored-dot emoji, for scannable badges instead of tiny text-only labels. */
export function severityIcon(sev: string): string {
  return sev === "critical" ? "🔴" : sev === "high" ? "🟠" : sev === "medium" ? "🟡" : "🟢";
}

/** Situation Index (0–100) → severity-band color token. Green→yellow→orange→red,
 *  deliberately distinct from category tokens so this always reads the same way. */
export function scoreColorToken(score: number): string {
  return score > 75 ? "--score-critical" : score > 50 ? "--score-high" : score > 25 ? "--score-medium" : "--score-low";
}

export function trustScoreToken(score: number): string {
  return score >= 70 ? "--faith" : score >= 45 ? "--humanitarian" : "--conflict";
}

export const trendGlyph: Record<string, string> = { up: "▲", down: "▼", flat: "→" };
