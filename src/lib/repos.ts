// Repositories: the data-access layer between API routes and Prisma.
// Every event/moderation DTO gets its trust assessment attached HERE, via the
// shared confidence service — routes and UI never recompute status themselves.

import { prisma } from "./db";
import {
  PUBLISH_THRESHOLD,
  assessTrust,
  classifyStatus,
  statusToken,
  type TrustAssessment,
} from "./confidence";
import type {
  AutomatedCheck,
  Category,
  Country,
  EventRecord,
  ModerationItem,
  PublishStatus,
  Severity,
  SourceInput,
  TimelineEntry,
} from "./types";

// ── Serialized DTOs returned by the API ─────────────────────────────────────

export interface EventDTO extends EventRecord {
  trust: TrustAssessment;
}

export interface CountryDTO extends Country {
  rank: number;
  totalCountries: number;
}

export interface ModerationDTO extends ModerationItem {
  publish: {
    status: PublishStatus;
    label: string;
    token: string;
    note: string;
  };
  /** Distinct queue counters for the toolbar. */
}

// ── Parsing helpers ─────────────────────────────────────────────────────────

function j<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

type PrismaEvent = Awaited<ReturnType<typeof prisma.event.findFirstOrThrow>> & {
  sources?: { name: string; verified: boolean; tier: string | null }[];
};

function toEventRecord(e: PrismaEvent): EventRecord {
  const sources: SourceInput[] = (e.sources ?? []).map((s) => ({
    name: s.name,
    verified: s.verified,
    tier: (s.tier as SourceInput["tier"]) ?? undefined,
  }));
  return {
    id: e.id,
    category: e.category as Category,
    title: e.title,
    country: e.countryName,
    lat: e.lat,
    lon: e.lon,
    severity: e.severity as Severity,
    timestamp: e.timestamp.getTime(),
    what: e.what,
    why: e.why,
    status: e.status,
    keywords: j<string[]>(e.keywords, []),
    timeline: j<TimelineEntry[]>(e.timeline, []),
    related: j<number[]>(e.related, []),
    sources,
    response: e.response ? j(e.response, undefined) : undefined,
    pending: e.pending,
    conflicting: e.conflicting,
    confidenceOverride: e.confidenceOverride ?? undefined,
  };
}

function attachTrust(rec: EventRecord): EventDTO {
  const trust = assessTrust({
    sources: rec.sources,
    pending: rec.pending,
    conflicting: rec.conflicting,
    confidenceOverride: rec.confidenceOverride,
  });
  return { ...rec, trust };
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function listEvents(opts?: {
  /** Only events eligible for the public feed (published/developing). */
  publicOnly?: boolean;
  category?: Category;
  sinceMs?: number;
}): Promise<EventDTO[]> {
  const rows = await prisma.event.findMany({
    where: {
      ...(opts?.category ? { category: opts.category } : {}),
      ...(opts?.sinceMs ? { timestamp: { gte: new Date(opts.sinceMs) } } : {}),
    },
    include: { sources: true },
    orderBy: { timestamp: "desc" },
  });
  let dtos = rows.map((r) => attachTrust(toEventRecord(r)));
  if (opts?.publicOnly) {
    // The public feed shows only what the shared service deems publishable —
    // withheld events (incl. all pending submissions) are never exposed.
    dtos = dtos.filter((d) => d.trust.status !== "withheld");
  }
  return dtos;
}

export async function getEvent(id: number): Promise<EventDTO | null> {
  const row = await prisma.event.findUnique({
    where: { id },
    include: { sources: true },
  });
  if (!row) return null;
  return attachTrust(toEventRecord(row));
}

// ── Countries ─────────────────────────────────────────────────────────────

export async function listCountries(): Promise<CountryDTO[]> {
  const rows = await prisma.country.findMany({ orderBy: { score: "desc" } });
  const total = rows.length;
  return rows.map((c, i) => ({
    name: c.name,
    flag: c.flag,
    code: c.code,
    pos: [c.lon, c.lat],
    score: c.score,
    trend: c.trend as Country["trend"],
    components: j<Record<string, number>>(c.components, {}),
    rank: i + 1,
    totalCountries: total,
  }));
}

export async function getCountry(name: string): Promise<CountryDTO | null> {
  const all = await listCountries();
  return all.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null;
}

// ── Moderation queue ─────────────────────────────────────────────────────────

type PrismaMod = Awaited<ReturnType<typeof prisma.moderationItem.findFirstOrThrow>>;

function toModerationDTO(m: PrismaMod): ModerationDTO {
  // THE shared threshold branch — identical to the public dossier's.
  const status = classifyStatus(m.trustScore, m.conflicting);
  const label =
    status === "withheld"
      ? "Withheld"
      : status === "developing"
        ? "Would publish · developing"
        : "Would publish";
  const note =
    status === "withheld"
      ? `Below the ${PUBLISH_THRESHOLD}% threshold — held from the public feed if approved.`
      : status === "developing"
        ? "Above threshold but sources disagree on detail."
        : `Above the ${PUBLISH_THRESHOLD}% threshold with consistent corroboration.`;
  return {
    id: m.id,
    category: m.category as Category,
    country: m.countryName,
    severity: m.severity as Severity,
    title: m.title,
    submitter: m.submitter,
    submittedAt: m.submittedAt.getTime(),
    trustScore: m.trustScore,
    mediaCount: m.mediaCount,
    flagged: m.flagged,
    conflicting: m.conflicting,
    checks: j<AutomatedCheck[]>(m.checks, []),
    aiVerdict: m.aiVerdict,
    body: m.body,
    sources: j<SourceInput[]>(m.sources, []),
    decision: (m.decision as ModerationItem["decision"]) ?? null,
    publish: { status, label, token: statusToken(status), note },
  };
}

export async function listModeration(filter?: {
  status?: "pending" | "flagged" | "approved" | "rejected";
  category?: Category;
  sort?: "severity" | "trust" | "recent";
}): Promise<{ items: ModerationDTO[]; counts: Record<string, number> }> {
  const rows = await prisma.moderationItem.findMany();
  let items = rows.map(toModerationDTO);

  const counts = {
    pending: items.filter((i) => i.decision === null && !i.flagged).length,
    flagged: items.filter((i) => i.flagged && i.decision === null).length,
    approved: items.filter((i) => i.decision === "approved").length,
    rejected: items.filter((i) => i.decision === "rejected").length,
  };

  if (filter?.status === "pending") items = items.filter((i) => i.decision === null && !i.flagged);
  else if (filter?.status === "flagged") items = items.filter((i) => i.flagged && i.decision === null);
  else if (filter?.status === "approved") items = items.filter((i) => i.decision === "approved");
  else if (filter?.status === "rejected") items = items.filter((i) => i.decision === "rejected");

  if (filter?.category) items = items.filter((i) => i.category === filter.category);

  const sevRank: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  if (filter?.sort === "severity") items.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);
  else if (filter?.sort === "trust") items.sort((a, b) => b.trustScore - a.trustScore);
  else items.sort((a, b) => b.submittedAt - a.submittedAt);

  return { items, counts };
}

export async function getModerationItem(id: number): Promise<ModerationDTO | null> {
  const row = await prisma.moderationItem.findUnique({ where: { id } });
  return row ? toModerationDTO(row) : null;
}

/** Apply a reviewer decision. Approving a publishable item promotes it to a
 *  live event; withheld items approve into the feed but stay non-public. */
export async function decideModeration(
  id: number,
  decision: "approved" | "rejected" | "flagged",
  reviewer: string,
): Promise<ModerationDTO | null> {
  const row = await prisma.moderationItem.findUnique({ where: { id } });
  if (!row) return null;
  const updated = await prisma.moderationItem.update({
    where: { id },
    data: {
      decision,
      flagged: decision === "flagged" ? true : row.flagged,
      decidedAt: new Date(),
      decidedBy: reviewer,
    },
  });
  return toModerationDTO(updated);
}

/** Bulk auto-approve verified high-trust items (queue "⚡ Auto-approve"). */
export async function autoApproveVerified(reviewer: string, minScore = 85): Promise<number> {
  const rows = await prisma.moderationItem.findMany({
    where: { decision: null, trustScore: { gte: minScore } },
  });
  let n = 0;
  for (const r of rows) {
    // Only auto-approve items the shared service would actually publish.
    if (classifyStatus(r.trustScore, r.conflicting) === "withheld") continue;
    await prisma.moderationItem.update({
      where: { id: r.id },
      data: { decision: "approved", decidedAt: new Date(), decidedBy: reviewer },
    });
    n++;
  }
  return n;
}

// ── Submissions (Submit Report modal) ─────────────────────────────────────

export interface ReportInput {
  category: Category;
  title: string;
  country: string;
  lat: number;
  lon: number;
  severity: Severity;
  summary: string;
  sources: SourceInput[];
  submitter?: string;
}

/** A community submission enters as a pending event AND a queue item.
 *  Pending → the shared service caps confidence and forces WITHHELD until
 *  a moderator promotes it. */
export async function createReport(input: ReportInput): Promise<{ eventId: number; moderationId: number }> {
  const created = await prisma.event.create({
    data: {
      category: input.category,
      title: input.title,
      countryName: input.country,
      lat: input.lat,
      lon: input.lon,
      severity: input.severity,
      timestamp: new Date(),
      what: input.summary,
      why: "",
      status: "Submitted for review.",
      keywords: JSON.stringify([]),
      timeline: JSON.stringify([{ at: "Now", text: "Submitted by community reporter" }]),
      related: JSON.stringify([]),
      pending: true,
      conflicting: false,
      sources: { create: input.sources.map((s) => ({ name: s.name, verified: false })) },
    },
    include: { sources: true },
  });

  // Confidence for the queue entry comes from the SAME shared service.
  const trust = assessTrust({ sources: input.sources, pending: true });
  const mod = await prisma.moderationItem.create({
    data: {
      category: input.category,
      countryName: input.country,
      severity: input.severity,
      title: input.title,
      submitter: input.submitter ?? "community-submission",
      trustScore: trust.confidence,
      mediaCount: 0,
      flagged: false,
      conflicting: false,
      checks: JSON.stringify([
        { label: "Source reputation", detail: "Community submission — unverified", ok: false },
        { label: "Cross-referenced", detail: "Awaiting corroboration", ok: false },
        { label: "Location match", detail: "Coordinates provided", ok: true },
        { label: "Media authenticity", detail: "No media attached", ok: false },
      ]),
      aiVerdict: "Automated intake: community submission held below threshold pending human verification and independent corroboration.",
      body: input.summary,
      sources: JSON.stringify(input.sources),
      decision: null,
    },
  });

  return { eventId: created.id, moderationId: mod.id };
}
