"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { AuthModal } from "./AuthModal";
import { useAuth } from "./Providers";
import { api } from "@/lib/client";
import type { EventDTO } from "@/lib/repos";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  relatedEventIds?: number[];
  live?: boolean;
}

const SUGGESTIONS = [
  "What's happening in Gaza today?",
  "Any flooding in Pakistan?",
  "What are today's good news stories?",
  "Any humanitarian emergencies right now?",
];

export function ChatView() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventsById, setEventsById] = useState<Map<number, EventDTO>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ events: EventDTO[] }>("/api/events")
      .then((r) => setEventsById(new Map(r.events.map((e) => [e.id, e]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((t) => [...t, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const r = await api<{ answer: string; relatedEventIds: number[]; live: boolean }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ question, history }),
      });
      setTurns((t) => [...t, { role: "assistant", content: r.answer, relatedEventIds: r.relatedEventIds, live: r.live }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong — try again.";
      setTurns((t) => [...t, { role: "assistant", content: message, live: false }]);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <>
        <Nav />
        <div className="page">
          <div className="page-hd">
            <div className="eyebrow">AI Chat</div>
            <h1>Ask UmmahMonitor</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
              Sign in to ask questions about live, verified events — answers are grounded only in the platform's own data.
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
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="page-hd">
          <div className="eyebrow">AI Chat</div>
          <h1>Ask UmmahMonitor</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
            Answers are grounded only in the platform's verified event feed — if it's not in the data, the assistant
            will say so rather than guess.
          </p>
        </div>

        <div className="chat-window">
          {turns.length === 0 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={`chat-turn chat-${t.role}`}>
              <div className="chat-bubble">
                {t.content}
                {t.relatedEventIds && t.relatedEventIds.length > 0 && (
                  <div className="chat-related">
                    {t.relatedEventIds.map((id) => {
                      const ev = eventsById.get(id);
                      if (!ev) return null;
                      return (
                        <Link key={id} href={`/?event=${id}`} className="chat-related-link">
                          {ev.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
                {t.role === "assistant" && t.live === false && (
                  <div className="chat-fallback-note">Not from live synthesis.</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-turn chat-assistant">
              <div className="chat-bubble ai-load"><span className="spinner" />Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about what's happening…"
            style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13.5 }}
          />
          <button type="submit" className="pill-btn" disabled={loading || !input.trim()}>Send</button>
        </form>
      </div>
    </>
  );
}
