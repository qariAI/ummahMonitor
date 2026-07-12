// Data Stories — long-form, editorially-authored pieces, distinct from the
// live event feed. Unlike everything else in this app, story content is NOT
// derived from the database at request time — it's authored, versioned
// content, same as a news outlet's published articles. That means every
// factual claim here must carry a real, checkable source; nothing in this
// file is invented. Stories without real researched content are marked
// "coming_soon" rather than filled with plausible-sounding placeholder
// numbers — see the project's standing rule against fabricating data.

export type StoryCategory =
  | "arts_culture"
  | "faith_society"
  | "humanitarian"
  | "conflict_peace"
  | "economy_finance"
  | "nature_climate"
  | "science_health"
  | "technology_digital"
  | "beautiful_news"
  | "history"
  | "explainers";

export const STORY_CATEGORIES: Record<StoryCategory, string> = {
  arts_culture: "Arts & Culture",
  faith_society: "Faith & Society",
  humanitarian: "Humanitarian",
  conflict_peace: "Conflict & Peace",
  economy_finance: "Economy & Finance",
  nature_climate: "Nature & Climate",
  science_health: "Science & Health",
  technology_digital: "Technology & Digital",
  beautiful_news: "Beautiful News",
  history: "History",
  explainers: "Explainers",
};

export interface StorySource {
  label: string;
  url: string;
}

export type StorySection =
  | { type: "prose"; heading?: string; body: string }
  | { type: "stat"; value: string; label: string; source: StorySource }
  | {
      type: "bar-chart";
      title: string;
      unit: string;
      data: { label: string; value: number }[];
      thresholds?: { value: number; label: string }[];
      source: StorySource;
    };

export interface Story {
  slug: string;
  title: string;
  category: StoryCategory;
  dek: string;
  heroStat?: { value: string; label: string };
  sections: StorySection[];
  sources: StorySource[];
  publishedAt: string; // editorial publish date — authored content, not live data
  status: "published" | "coming_soon";
}

export const STORIES: Story[] = [
  {
    slug: "water-scarcity-mena",
    title: "Water Scarcity Across MENA",
    category: "nature_climate",
    dek: "The Middle East and North Africa has the lowest water availability of any region on Earth — and by 2030, the entire region falls below the internationally recognized scarcity line.",
    heroStat: { value: "480 m³", label: "water available per person per year in MENA, 2023 — the world's lowest" },
    status: "published",
    publishedAt: "2026-07-11",
    sections: [
      {
        type: "prose",
        heading: "The world's most water-stressed region",
        body: "The Middle East and North Africa (MENA) has the lowest average annual water availability per person of any region on Earth: 480 cubic meters in 2023, less than a tenth of the global average. Fourteen of the world's seventeen most water-stressed countries are in this region. And the trend line only goes one direction — the World Bank projects that by 2030, the region's average per-capita water availability will drop below 500 cubic meters a year, the internationally recognized threshold for \"absolute scarcity.\"",
      },
      {
        type: "stat",
        value: "500 m³",
        label: "the \"absolute water scarcity\" threshold MENA falls below, region-wide, by 2030",
        source: { label: "World Bank, 2023", url: "https://www.worldbank.org/en/news/press-release/2023/04/27/water-scarcity-in-mena-requires-bold-actions-says-world-bank-report" },
      },
      {
        type: "bar-chart",
        title: "Renewable water resources per capita, by MENA country",
        unit: "m³ per person per year",
        data: [
          { label: "Kuwait", value: 4.68 },
          { label: "Qatar", value: 20.13 },
          { label: "Bahrain", value: 68.17 },
          { label: "Saudi Arabia", value: 68.94 },
          { label: "Jordan", value: 91.83 },
          { label: "Libya", value: 101.87 },
          { label: "Palestine", value: 164.07 },
          { label: "Algeria", value: 266.06 },
          { label: "Tunisia", value: 390.49 },
          { label: "Egypt", value: 561.88 },
          { label: "Morocco", value: 785.68 },
          { label: "Sudan", value: 862.04 },
          { label: "Syria", value: 960.08 },
          { label: "Yemen", value: 1345.63 },
          { label: "Iraq", value: 2234.07 },
        ],
        thresholds: [
          { value: 500, label: "Absolute scarcity" },
          { value: 1000, label: "Scarcity" },
        ],
        source: { label: "World Bank / FAO AQUASTAT, 2020 data", url: "https://en.wikipedia.org/wiki/List_of_countries_by_total_renewable_water_resources" },
      },
      {
        type: "prose",
        heading: "Why: agriculture and population growth",
        body: "Agriculture consumes up to 80% of total water use across MENA — and the shift toward water-intensive cash crops over the past six decades has intensified the strain. Underneath that is simple demography: the region's population grew from just over 100 million in 1960 to more than 500 million in 2023, and is projected to approach 700–720 million by 2050. More people, more irrigation, more cities competing for the same shrinking supply.",
      },
      {
        type: "stat",
        value: "~5×",
        label: "MENA's population growth from 1960 (~100M) to 2023 (~500M)",
        source: { label: "World Bank Open Data, via Arab Reform Initiative, 2025", url: "https://www.arab-reform.net/publication/financing-water-justice-international-aid-and-development-in-the-mena-region/" },
      },
      {
        type: "prose",
        heading: "The response: desalination and financing",
        body: "Gulf states have leaned hard on desalination — 60% of the world's desalination capacity sits in the Gulf, with Saudi Arabia alone accounting for 30% of the global total. Regional development finance has also scaled up: the Arab Fund for Economic and Social Development has provided over $8.1 billion across 149 water-related projects, helping build more than 3,800 kilometers of wastewater networks that now treat 6 million cubic meters of wastewater daily.",
      },
      {
        type: "stat",
        value: "$8.1B",
        label: "financed across 149 water projects by the Arab Fund for Economic and Social Development",
        source: { label: "World Bank Blogs, March 2025", url: "https://blogs.worldbank.org/en/voices/in-mena-make-every-drop-of-water-count" },
      },
      {
        type: "prose",
        heading: "What's next",
        body: "Even with current investment, the World Bank estimates the region will need an additional 25 billion cubic meters of water a year by 2050 under current management strategies — equivalent to building 65 desalination plants the size of Saudi Arabia's Ras Al Khair plant, currently the world's largest. The Bank's own recommendation isn't just more infrastructure: it's institutional reform, arguing that centralized, technocratic water allocation systems need to give local authorities more control to resolve tradeoffs — particularly between farms and cities — before the crisis deepens further.",
      },
    ],
    sources: [
      { label: "World Bank — In MENA, make every drop of water count (2025)", url: "https://blogs.worldbank.org/en/voices/in-mena-make-every-drop-of-water-count" },
      { label: "World Bank — Water Scarcity in MENA Requires Bold Actions (2023)", url: "https://www.worldbank.org/en/news/press-release/2023/04/27/water-scarcity-in-mena-requires-bold-actions-says-world-bank-report" },
      { label: "World Bank / FAO AQUASTAT — Renewable water resources by country (2020 data)", url: "https://en.wikipedia.org/wiki/List_of_countries_by_total_renewable_water_resources" },
      { label: "Arab Reform Initiative — Financing Water Justice in MENA (2025)", url: "https://www.arab-reform.net/publication/financing-water-justice-international-aid-and-development-in-the-mena-region/" },
      { label: "Population Reference Bureau — Population and Water Scarcity in MENA", url: "https://www.prb.org/resource/finding-the-balance-population-and-water-scarcity-in-the-middle-east-and-north-africa/" },
    ],
  },

  // ── Coming soon — real placeholders, not fabricated content. Each of
  // these needs its own research pass before publishing, same as the one
  // above. Listed here so the category taxonomy is visible end-to-end.
  { slug: "years-of-conflict-middle-east", title: "Years of Conflict in the Middle East", category: "conflict_peace", dek: "A data-driven look at the region's conflicts over time.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "scale-of-humanitarian-displacement", title: "The Scale of Humanitarian Displacement", category: "humanitarian", dek: "How many people are displaced, and where.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "global-zakat-charitable-giving", title: "Global Zakat & Charitable Giving", category: "economy_finance", dek: "The scale and flow of Islamic charitable giving worldwide.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "state-of-muslim-world-2026", title: "The State of the Muslim World 2026", category: "faith_society", dek: "An annual data portrait of the global Muslim community.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "economics-of-halal-industries", title: "The Economics of Halal Industries", category: "economy_finance", dek: "The size and growth of the global halal economy.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "climate-change-food-security", title: "Climate Change & Food Security", category: "nature_climate", dek: "How a warming climate threatens food supply in Muslim-majority regions.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "mosques-around-the-world", title: "Mosques Around the World", category: "faith_society", dek: "A visual census of mosques by region, age, and architecture.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "global-hajj-journey", title: "The Global Hajj Journey", category: "faith_society", dek: "Tracking the world's largest annual pilgrimage.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "education-muslim-majority-countries", title: "Education Across Muslim-Majority Countries", category: "science_health", dek: "Literacy, enrollment, and access to education, compared.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
  { slug: "beautiful-news-roundup", title: "Beautiful News: The Year in Good News", category: "beautiful_news", dek: "An annual roundup of the Ummah's positive developments.", status: "coming_soon", publishedAt: "", sections: [], sources: [] },
];

export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}
