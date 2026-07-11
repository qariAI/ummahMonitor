// AI-generated situational briefing — a synthesis across many events
// ("Today's Ummah" / country-specific), distinct from brief.ts which
// generates a note for one single event.
//
// Cached in the DB per scope (REFRESH_MS) rather than regenerated on every
// page load — this is the cost-control gap flagged for /api/brief in the
// original launch audit; briefings are shared across all visitors between
// refreshes instead of hitting the Anthropic API per-request.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import type { EventDTO } from "./repos";

const KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const client = KEY ? new Anthropic({ apiKey: KEY }) : null;

const REFRESH_MS = 3 * 3600_000; // regenerate at most once every 3 hours per scope
const WORDS_PER_SECOND = 200 / 60; // ~200wpm reading speed, for the "X second read" estimate

export interface BriefingResult {
  scope: string;
  bullets: string[];
  readSeconds: number;
  live: boolean;
  generatedAt: number;
}

function buildPrompt(scope: string, events: EventDTO[]): string {
  const lines = events
    .slice(0, 30)
    .map((e) => `- [${e.category}/${e.severity}] ${e.country}: ${e.title}`)
    .join("\n");
  const scopeLine = scope === "global" ? "across the whole Muslim world (the Ummah)" : `specifically in ${scope}`;
  return [
    "You are the daily briefing analyst for UmmahMonitor, a live situational dashboard for the global Muslim community.",
    `Write a concise briefing ${scopeLine}, synthesizing the verified events below into 4-6 short bullet points.`,
    "Aim for a balanced mix, not a wall of bad news: prioritize humanitarian developments, faith/community milestones, and any genuinely positive/good-news items alongside conflict or emergency items. Don't let conflict dominate every bullet if calmer or positive items exist in the data below — but never invent a positive item that isn't in the data.",
    "Each bullet: one sentence, factual, no editorializing, no markdown, no emoji.",
    "Respond ONLY as a JSON array of strings, nothing else — no preamble, no code fences.",
    "",
    "EVENTS:",
    lines || "(no significant verified events in range)",
  ].join("\n");
}

function estimateReadSeconds(bullets: string[]): number {
  const words = bullets.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(10, Math.round(words / WORDS_PER_SECOND));
}

// No API key, no events, or a failed/malformed call — fall back to the top
// event titles verbatim. Still real data, just not synthesized into prose.
function fallbackBullets(events: EventDTO[]): string[] {
  if (events.length === 0) return ["No significant verified developments in this range."];
  return events.slice(0, 5).map((e) => `${e.country}: ${e.title}`);
}

export async function getBriefing(scope: string, events: EventDTO[]): Promise<BriefingResult> {
  const cached = await prisma.briefing.findFirst({
    where: { scope, generatedAt: { gte: new Date(Date.now() - REFRESH_MS) } },
    orderBy: { generatedAt: "desc" },
  });
  if (cached) {
    return {
      scope,
      bullets: JSON.parse(cached.bullets),
      readSeconds: cached.readSeconds,
      live: cached.live,
      generatedAt: cached.generatedAt.getTime(),
    };
  }

  let bullets: string[];
  let live: boolean;

  if (!client || events.length === 0) {
    bullets = fallbackBullets(events);
    live = false;
  } else {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: "user", content: buildPrompt(scope, events) }],
      });
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((x) => typeof x === "string")) {
        bullets = parsed;
        live = true;
      } else {
        bullets = fallbackBullets(events);
        live = false;
      }
    } catch {
      bullets = fallbackBullets(events);
      live = false;
    }
  }

  const readSeconds = estimateReadSeconds(bullets);
  const record = await prisma.briefing.create({
    data: { scope, bullets: JSON.stringify(bullets), readSeconds, live },
  });
  return { scope, bullets, readSeconds, live, generatedAt: record.generatedAt.getTime() };
}
