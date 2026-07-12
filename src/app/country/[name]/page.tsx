import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountry, listEvents } from "@/lib/repos";
import { Nav } from "@/components/Nav";
import { FollowCountryButton } from "@/components/FollowCountryButton";
import { CountryBriefing } from "@/components/CountryBriefing";
import { CATEGORIES, scoreColorToken, trendGlyph } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const country = await getCountry(decodeURIComponent(name));
  if (!country) notFound();
  const events = (await listEvents({ publicOnly: true })).filter((e) => e.country === country.name);

  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-hd">
          <div className="eyebrow">Country dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <h1>
              {country.flag} {country.name}
            </h1>
            <FollowCountryButton country={country.name} />
          </div>
        </div>

        <div className="card-grid">
          <CountryBriefing country={country.name} />
          <div className="card">
            <h3 title="Composite of Safety, Humanitarian, Worship &amp; Economy indicators (0–100, higher = more severe)">Situation Index</h3>
            <p style={{ fontSize: 11.5, color: "var(--faint)", margin: "-6px 0 12px", lineHeight: 1.4 }}>
              Composite score (0–100) from conflict, humanitarian need, disaster impact &amp; verified developments.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="score-num" style={{ color: `var(${scoreColorToken(country.score)})`, fontSize: 52 }}>{country.score}</div>
              <div>
                <div className={`tr ${country.trend}`} style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                  {trendGlyph[country.trend]} {country.trend}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>rank {country.rank} of {country.totalCountries}</div>
              </div>
            </div>
            <div className="comps" style={{ marginTop: 16 }}>
              {Object.entries(country.components).map(([k, v]) => (
                <div className="comp" key={k}>
                  <span className="cl">{k}</span>
                  <span className="cb"><i style={{ width: `${v}%`, background: `var(${scoreColorToken(v)})` }} /></span>
                  <span className="cv">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ gridColumn: "span 2" }}>
            <h3>Event history · {events.length}</h3>
            {events.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No public events for this country.</p>}
            {events.map((e) => (
              <Link key={e.id} href={`/?event=${e.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", textDecoration: "none", borderBottom: "1px solid var(--stroke)" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: `var(${CATEGORIES[e.category].token})` }} />
                <span style={{ flex: 1, fontSize: 13 }}>{e.title}</span>
                <span className="badge" style={{ background: `color-mix(in srgb, var(${e.trust.status === "published" ? "--faith" : e.trust.status === "developing" ? "--humanitarian" : "--conflict"}) 15%, transparent)`, color: `var(${e.trust.status === "published" ? "--faith" : e.trust.status === "developing" ? "--humanitarian" : "--conflict"})` }}>
                  {e.trust.confidence}%
                </span>
              </Link>
            ))}
          </div>
        </div>
        <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "var(--faith)", fontSize: 13 }}>← Back to map</Link>
      </div>
    </>
  );
}
