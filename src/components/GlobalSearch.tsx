"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  kind: "country" | "event" | "story";
  id: string;
  title: string;
  sub: string;
  href: string;
}

const KIND_ICON: Record<SearchResult["kind"], string> = {
  country: "🌍",
  event: "📍",
  story: "📖",
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((r) => { setResults(r?.data?.results ?? []); setActiveIdx(0); })
        .catch(() => {});
    }, 200); // debounce
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(r: SearchResult) {
    router.push(r.href);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[activeIdx]) { go(results[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className="global-search" ref={boxRef}>
      <span className="global-search-icon">🔍</span>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search countries, events, stories…"
        className="global-search-input"
      />
      {open && results.length > 0 && (
        <div className="global-search-dropdown">
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.id}`}
              className={`global-search-result${i === activeIdx ? " active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => go(r)}
            >
              <span className="global-search-result-icon">{KIND_ICON[r.kind]}</span>
              <span className="global-search-result-body">
                <span className="global-search-result-title">{r.title}</span>
                <span className="global-search-result-sub">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="global-search-dropdown">
          <div className="global-search-empty">No matches for "{query}"</div>
        </div>
      )}
    </div>
  );
}
