// ─────────────────────────────────────────────────────────────────────────
// SHARED CONFIDENCE / CORROBORATION SERVICE  (README priority #2)
//
// This is the SINGLE source of truth for the trust model. Both surfaces —
//   • the public Event Dossier's "Verification" panel, and
//   • the Moderation Queue's publish-threshold pill / AI Trust Assessment
// consume `classifyStatus()` and `assessTrust()` from here. Neither surface
// reimplements the threshold math, so a public event and its queue entry can
// never disagree on published/developing/withheld.
//
// Ported faithfully from the prototype's `eventTrust()` (UmmahMonitor.dc.html)
// and `pubStatus()` (Moderation Queue.dc.html), which share the same threshold.
// ─────────────────────────────────────────────────────────────────────────

import type {
  PublishStatus,
  SourceInput,
  Tier,
} from "./types";

/** Publish threshold (%). Configurable backend constant, not a UI magic number. */
export const PUBLISH_THRESHOLD: number = clampThreshold(
  Number(process.env.PUBLISH_THRESHOLD ?? 70),
);

function clampThreshold(n: number): number {
  if (!Number.isFinite(n)) return 70;
  return Math.max(1, Math.min(99, Math.round(n)));
}

/** Tier metadata: display label, accent token, and corroboration weight. */
export const TIER_META: Record<Tier, { label: string; weight: number; token: string }> = {
  official: { label: "Official", weight: 42, token: "--community" },
  wire: { label: "Wire", weight: 36, token: "--education" },
  relief: { label: "Relief", weight: 34, token: "--faith" },
  regional: { label: "Regional", weight: 24, token: "--humanitarian" },
  community: { label: "Community", weight: 10, token: "--economy" },
};

/**
 * Source directory → tier. Ingested-source classification lives with the data
 * layer (Settings → Source Directory). Unknown sources default to "regional".
 */
export const SOURCE_DIRECTORY: Record<string, Tier> = {
  "Saudi Press Agency": "official",
  "Gulf News": "regional",
  "Moonsighting.com": "community",
  Dawn: "regional",
  "NDMA Pakistan": "official",
  "Al Jazeera": "wire",
  "UN OCHA": "official",
  OCHA: "official",
  Reuters: "wire",
  "Middle East Eye": "regional",
  MSF: "relief",
  "Sudan Tribune": "regional",
  WHO: "official",
  SVT: "regional",
  "Anadolu Agency": "wire",
  "IFN — Islamic Finance News": "regional",
  TOLOnews: "regional",
  AFP: "wire",
  "L'Orient-Le Jour": "regional",
  UNIFIL: "official",
  "Daily Trust": "regional",
  "TVC News": "regional",
  "Al-Ahram": "regional",
  "University of Oxford": "official",
  CBC: "wire",
  "Muslim Link": "community",
  "The Edge Malaysia": "regional",
  "Salaam Gateway": "regional",
  "Arab News": "regional",
  "TRT World": "wire",
  Diyanet: "official",
  "Klix.ba": "regional",
  "Balkan Insight": "regional",
  "Radio Dabanga": "wire",
};

export function tierOf(source: SourceInput): Tier {
  return source.tier ?? SOURCE_DIRECTORY[source.name] ?? "regional";
}

export interface AssessInput {
  sources: SourceInput[];
  /** Unmoderated submission — caps confidence and forces sources unverified. */
  pending?: boolean;
  /** Sources agree on occurrence but conflict on detail. */
  conflicting?: boolean;
  /** Skip derivation and use this confidence directly (0-100). */
  confidenceOverride?: number;
}

export interface AssessedSource {
  name: string;
  tier: Tier;
  tierLabel: string;
  tierToken: string;
  verified: boolean;
  /** Counts toward corroboration (verified AND not part of a pending item). */
  corroborating: boolean;
  detail: string;
}

export interface TrustAssessment {
  threshold: number;
  confidence: number;
  status: PublishStatus;
  statusLabel: string;
  /** Number of independent corroborating sources. */
  independent: number;
  /** Number of distinct tiers among corroborating sources. */
  diversity: number;
  corroborationLine: string;
  sources: AssessedSource[];
  /** Plain-language explanation of the status. */
  note: string;
  captionSub: string;
  /** Requirement / hold banner for non-published states, else null. */
  requirement: { icon: string; title: string; text: string } | null;
}

/**
 * Derive a 0-100 confidence score from a tiered, verified source list.
 * (Ported from prototype `eventTrust`: verified sources contribute full tier
 * weight; unverified contribute 40%; a diversity bonus rewards distinct tiers;
 * pending submissions are capped.)
 */
export function computeConfidence(input: AssessInput): number {
  if (input.confidenceOverride != null) {
    return clampScore(input.confidenceOverride);
  }
  const pending = !!input.pending;
  let score = 0;
  const tiersSeen = new Set<Tier>();
  for (const src of input.sources) {
    const tier = tierOf(src);
    const weight = TIER_META[tier].weight;
    const corroborating = !!src.verified && !pending;
    if (corroborating) {
      score += weight;
      tiersSeen.add(tier);
    } else {
      score += weight * 0.4;
    }
  }
  const diversity = tiersSeen.size;
  score += Math.max(0, diversity - 1) * 6;
  if (pending) score = Math.min(score, 32);
  return Math.max(4, Math.min(98, Math.round(score)));
}

/**
 * THE shared threshold branch. Everything published/developing/withheld —
 * on both the public dossier and the moderation queue — goes through here.
 */
export function classifyStatus(
  confidence: number,
  conflicting: boolean,
  threshold: number = PUBLISH_THRESHOLD,
): PublishStatus {
  if (confidence < threshold) return "withheld";
  return conflicting ? "developing" : "published";
}

/** Convenience: is this confidence/conflict combination public-feed eligible? */
export function isPublishable(
  confidence: number,
  conflicting: boolean,
  threshold: number = PUBLISH_THRESHOLD,
): boolean {
  return classifyStatus(confidence, conflicting, threshold) !== "withheld";
}

/**
 * Full trust assessment for a rich UI (Verification panel + AI Trust
 * Assessment). Derives confidence, classifies status via the shared branch,
 * and builds corroboration metadata + copy.
 */
export function assessTrust(
  input: AssessInput,
  threshold: number = PUBLISH_THRESHOLD,
): TrustAssessment {
  const pending = !!input.pending;
  const conflicting = !!input.conflicting;
  const confidence = computeConfidence(input);
  const status = classifyStatus(confidence, conflicting, threshold);

  const tiersSeen = new Set<Tier>();
  const sources: AssessedSource[] = input.sources.map((src) => {
    const tier = tierOf(src);
    const corroborating = !!src.verified && !pending;
    if (corroborating) tiersSeen.add(tier);
    return {
      name: src.name,
      tier,
      tierLabel: TIER_META[tier].label,
      tierToken: TIER_META[tier].token,
      verified: !!src.verified,
      corroborating,
      detail: corroborating
        ? "Verified · corroborated"
        : pending
          ? "Awaiting verification"
          : "Reported · unconfirmed",
    };
  });

  const independent = sources.filter((s) => s.corroborating).length;
  const diversity = tiersSeen.size;
  const corroborationLine =
    independent > 0
      ? `${independent} independent · ${diversity} type${diversity === 1 ? "" : "s"}`
      : "No corroborating sources";

  let note: string;
  let captionSub: string;
  let requirement: TrustAssessment["requirement"] = null;

  if (status === "published") {
    note = `Above the ${threshold}% threshold with consistent corroboration — live in the public feed.`;
    captionSub = "high confidence";
  } else if (status === "developing") {
    note = "Above threshold but sources disagree on detail — published with a developing flag.";
    captionSub = "sources conflict";
    requirement = {
      icon: "◐",
      title: "Developing — figures held",
      text: "Event confirmed and published, but some details are disputed across sources. Specific figures are withheld until an official count corroborates them.",
    };
  } else {
    note = `Below the ${threshold}% threshold — held in review, never shown as fact.`;
    captionSub = "unverified";
    requirement = {
      icon: "⚠",
      title: "Held from public feed",
      text: `Needs an official or Tier-1 wire source with independent corroboration to cross the ${threshold}% threshold. Until then it stays in the review queue.`,
    };
  }

  return {
    threshold,
    confidence,
    status,
    statusLabel: status.toUpperCase(),
    independent,
    diversity,
    corroborationLine,
    sources,
    note,
    captionSub,
    requirement,
  };
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 4;
  return Math.max(4, Math.min(98, Math.round(n)));
}

/** UI helper: status → accent token. Kept here so surfaces share the mapping. */
export function statusToken(status: PublishStatus): string {
  return status === "published"
    ? "--faith"
    : status === "developing"
      ? "--humanitarian"
      : "--conflict";
}
