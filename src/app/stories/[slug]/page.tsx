import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StoryBarChart } from "@/components/stories/StoryBarChart";
import { getStory, STORY_CATEGORIES } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story || story.status !== "published") notFound();

  return (
    <>
      <Nav />
      <div className="page" style={{ maxWidth: 760 }}>
        <div className="page-hd">
          <div className="eyebrow">{STORY_CATEGORIES[story.category]}</div>
          <h1 style={{ fontSize: 38, lineHeight: 1.15 }}>{story.title}</h1>
          <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>{story.dek}</p>
        </div>

        {story.heroStat && (
          <div style={{ background: "var(--panel-solid)", border: "1px solid var(--stroke)", borderRadius: "var(--radius)", padding: "24px 28px", marginBottom: 28 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 44, fontWeight: 700, color: "var(--faith)", lineHeight: 1 }}>
              {story.heroStat.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{story.heroStat.label}</div>
          </div>
        )}

        {story.sections.map((section, i) => {
          if (section.type === "prose") {
            return (
              <div key={i} style={{ marginBottom: 24 }}>
                {section.heading && <h2 style={{ fontFamily: "var(--display)", fontSize: 22, marginBottom: 10 }}>{section.heading}</h2>}
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>{section.body}</p>
              </div>
            );
          }
          if (section.type === "stat") {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, background: "color-mix(in srgb, var(--faith) 6%, transparent)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: "var(--faith)", flex: "none" }}>{section.value}</div>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.4 }}>{section.label}</div>
                  <a href={section.source.url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: "var(--faint)", textDecoration: "none" }}>
                    Source: {section.source.label} ↗
                  </a>
                </div>
              </div>
            );
          }
          if (section.type === "bar-chart") {
            return <StoryBarChart key={i} title={section.title} unit={section.unit} data={section.data} thresholds={section.thresholds} source={section.source} />;
          }
          return null;
        })}

        <div style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid var(--stroke)" }}>
          <h3 style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 10 }}>
            Sources
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {story.sources.map((s) => (
              <li key={s.url} style={{ fontSize: 12, color: "var(--muted)" }}>
                <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--faith)" }}>{s.label}</a>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 14 }}>
            Published {story.publishedAt}. This is authored editorial content — unlike the live map, it is not
            regenerated from the database and won't update automatically as new data emerges.
          </p>
        </div>

        <Link href="/stories" style={{ display: "inline-block", marginTop: 24, color: "var(--faith)", fontSize: 13 }}>
          ← All stories
        </Link>
      </div>
    </>
  );
}
