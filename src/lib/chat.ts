// AI Chat — conversational Q&A over the platform's own verified event data.
// Deliberately RAG-lite: the event dataset is small enough to hand the
// model directly rather than building vector-search infra, but the same
// no-fabrication discipline applies as everywhere else — the system prompt
// forbids answering current-events questions from general knowledge.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import type { EventDTO } from "./repos";

const KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const client = KEY ? new Anthropic({ apiKey: KEY }) : null;

// First AI endpoint in the app with a real server-enforced rate limit —
// closes (for this route) the gap flagged since the original launch audit.
const DAILY_LIMIT = 40;

export class RateLimitError extends Error {
  constructor() {
    super("You've reached today's chat limit — try again tomorrow.");
    this.name = "RateLimitError";
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function checkAndIncrementUsage(userId: string): Promise<void> {
  const date = todayKey();
  const existing = await prisma.chatUsage.findUnique({ where: { userId_date: { userId, date } } });
  if (existing && existing.count >= DAILY_LIMIT) throw new RateLimitError();
  await prisma.chatUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  answer: string;
  relatedEventIds: number[];
  live: boolean;
}

function buildSystemPrompt(events: EventDTO[]): string {
  const lines = events
    .slice(0, 60)
    .map((e) => `[id:${e.id}] [${e.category}/${e.severity}] ${e.country}: ${e.title} — ${e.what}`)
    .join("\n");
  return [
    "You are the UmmahMonitor assistant. Answer ONLY using the verified event data listed below, which is the platform's own live, moderated feed for the global Muslim community.",
    "Never use outside/general knowledge for claims about current events, casualty figures, dates, or statuses. If the data below doesn't answer the question, say so plainly rather than guessing.",
    "General background/definitional knowledge is fine (e.g. explaining what Zakat or Hajj is) — the restriction is specifically on current-events claims.",
    "Keep answers concise: 2-5 sentences unless the user explicitly asks for more detail.",
    'Respond ONLY as JSON: {"answer": string, "relatedEventIds": number[]}. relatedEventIds lists the [id:N] values of events you actually drew on — empty array if none apply. No markdown, no code fences, no preamble outside the JSON.',
    "",
    "EVENTS:",
    lines || "(no events currently available)",
  ].join("\n");
}

export async function answerChat(
  userId: string,
  question: string,
  history: ChatTurn[],
  events: EventDTO[],
): Promise<ChatResult> {
  await checkAndIncrementUsage(userId); // throws RateLimitError, not caught here — let the route handle it

  if (!client) {
    return { answer: "Live chat analyst unavailable right now — please check back later.", relatedEventIds: [], live: false };
  }
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: buildSystemPrompt(events),
      messages: [
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: "user" as const, content: question },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (typeof parsed.answer === "string") {
      const relatedEventIds = Array.isArray(parsed.relatedEventIds)
        ? parsed.relatedEventIds.filter((x: unknown): x is number => typeof x === "number")
        : [];
      return { answer: parsed.answer, relatedEventIds, live: true };
    }
    throw new Error("malformed response");
  } catch {
    return { answer: "Something went wrong generating a response — please try again.", relatedEventIds: [], live: false };
  }
}
