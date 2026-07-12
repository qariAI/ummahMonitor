import Link from "next/link";
import { Nav } from "@/components/Nav";
import { STORIES, STORY_CATEGORIES, type StoryCategory } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default function StoriesIndexPage() {
  const categories = Object.keys(STORY_CATEGORIES) as StoryCategory[];

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Data Stories</div>
          <h1>Visual narratives</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, maxWidth: 640 }}>
            Long-form, sourced explorations of the data behind the map — real datasets, real citations, original
            visualizations. Not every category has a published story yet; unpublished topics are listed so you can
            see where this is headed.
          </p>
        </div>

        {categories.map((cat) => {
          const stories = STORIES.filter((s) => s.category === cat);
          if (stories.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 30 }}>
              <h2 style={{ fontSize: 13, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 12 }}>
                {STORY_CATEGORIES[cat]}
              </h2>
              <div className="card-grid">
                {stories.map((s) => {
                  const cardStyle: React.CSSProperties = {
                    textDecoration: "none", display: "block",
                    opacity: s.status === "coming_soon" ? 0.55 : 1,
                    cursor: s.status === "coming_soon" ? "default" : "pointer",
                  };
                  const cardContent = (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <h3 style={{ margin: 0 }}>{s.title}</h3>
                        {s.status === "coming_soon" && (
                          <span className="badge" style={{ background: "var(--bg2)", color: "var(--faint)" }}>Coming soon</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{s.dek}</p>
                    </>
                  );
                  return s.status === "published" ? (
                    <Link key={s.slug} href={`/stories/${s.slug}`} className="card" style={cardStyle}>
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={s.slug} className="card" style={cardStyle}>
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
