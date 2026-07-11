// Shared domain types for UmmahMonitor.
// Data shapes mirror the README "State Management" section and the prototype
// mock-data structures, normalized for a real data layer.

export type Category =
  | "faith"
  | "community"
  | "humanitarian"
  | "conflict"
  | "economy"
  | "education"
  | "good_news";

export type Severity = "low" | "medium" | "high" | "critical";

export type Trend = "up" | "down" | "flat";

/** Source tier keys, ordered from most to least authoritative. */
export type Tier = "official" | "wire" | "relief" | "regional" | "community";

/** Publish status governed by the single shared confidence threshold. */
export type PublishStatus = "published" | "developing" | "withheld";

export interface SourceInput {
  name: string;
  /** Whether the source has been independently verified. */
  verified: boolean;
  /** Optional explicit tier; inferred from the source directory when absent. */
  tier?: Tier;
}

export interface Country {
  name: string;
  flag: string;
  code: string;
  /** [lon, lat] */
  pos: [number, number];
  /** Community-pressure / concern index, 0-100 (higher = more acute). */
  score: number;
  trend: Trend;
  /** Component breakdown scores, each 0-100. */
  components: Record<string, number>;
}

export interface TimelineEntry {
  at: string;
  text: string;
}

export interface Responder {
  name: string;
  type: "relief" | "official" | "medical" | "rescue";
  note: string;
  verified: boolean;
}

export interface DonationAppeal {
  org: string;
  appeal: string;
  note: string;
  verified: boolean;
  /** Suggested amount in minor units (cents), used to seed checkout. */
  suggestedAmount?: number;
}

export interface ResponseModule {
  phase: "ongoing" | "response" | "recovery";
  responders: Responder[];
  donate: DonationAppeal[];
  volunteer?: string;
  dua?: string;
}

export interface EventRecord {
  id: number;
  category: Category;
  title: string;
  country: string;
  lat: number;
  lon: number;
  severity: Severity;
  /** Epoch ms. */
  timestamp: number;
  what: string;
  why: string;
  status: string;
  keywords: string[];
  timeline: TimelineEntry[];
  related: number[];
  sources: SourceInput[];
  response?: ResponseModule;
  /** Unmoderated community submission. */
  pending: boolean;
  /** Sources agree on occurrence but conflict on detail (e.g. casualty counts). */
  conflicting: boolean;
  /** Optional confidence override (skips derivation from sources). */
  confidenceOverride?: number;
}

export interface AutomatedCheck {
  label: string;
  detail: string;
  ok: boolean;
}

export interface ModerationItem {
  id: number;
  category: Category;
  country: string;
  severity: Severity;
  title: string;
  submitter: string;
  submittedAt: number;
  /** Precomputed trust/confidence score for this submission, 0-100. */
  trustScore: number;
  mediaCount: number;
  flagged: boolean;
  conflicting: boolean;
  checks: AutomatedCheck[];
  aiVerdict: string;
  body: string;
  sources: SourceInput[];
  decision: "approved" | "rejected" | "flagged" | null;
}
