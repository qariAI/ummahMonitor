import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/chat", icon: "💬", label: "Chat" },
  { href: "/broadcast", icon: "📺", label: "Broadcast" },
  { href: "/data", icon: "📊", label: "Data" },
  { href: "/stories", icon: "📖", label: "Stories" },
];

// A single slim row of quick links to the newer sections — deliberately not
// a big promotional block. Sits right under the stats bar, same visual
// weight, so it reads as part of the header rather than an interruption.
export function ExploreStrip() {
  return (
    <div className="explore-strip">
      <span className="explore-label">Explore</span>
      {EXPLORE_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="explore-link">
          <span>{l.icon}</span> {l.label}
        </Link>
      ))}
    </div>
  );
}
