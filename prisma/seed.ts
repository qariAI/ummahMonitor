// Seed the data layer from the prototype mock data (README "State Management").
// Countries, events (with sources/response modules), and moderation queue items.
// Trust/confidence is NEVER seeded — it is always recomputed by the shared
// confidence service from the source list, so seed data can't drift from it.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const H = 3600_000;
const now = Date.now();

// ── Countries: community-pressure index + component breakdown ───────────────
const COUNTRIES: Array<{
  name: string; flag: string; code: string; pos: [number, number];
  score: number; trend: string; comp: Record<string, number>;
}> = [
  { name: "Palestine", flag: "🇵🇸", code: "PS", pos: [34.45, 31.53], score: 91, trend: "up", comp: { Safety: 96, Humanitarian: 94, Worship: 72, Economy: 88 } },
  { name: "Sudan", flag: "🇸🇩", code: "SD", pos: [25.35, 13.63], score: 86, trend: "up", comp: { Safety: 88, Humanitarian: 92, Worship: 44, Economy: 80 } },
  { name: "Afghanistan", flag: "🇦🇫", code: "AF", pos: [70.45, 34.42], score: 79, trend: "up", comp: { Safety: 70, Humanitarian: 84, Worship: 58, Economy: 82 } },
  { name: "Pakistan", flag: "🇵🇰", code: "PK", pos: [68.94, 26.06], score: 63, trend: "up", comp: { Safety: 48, Humanitarian: 78, Worship: 30, Economy: 68 } },
  { name: "Lebanon", flag: "🇱🇧", code: "LB", pos: [35.20, 33.27], score: 54, trend: "down", comp: { Safety: 58, Humanitarian: 56, Worship: 28, Economy: 72 } },
  { name: "Nigeria", flag: "🇳🇬", code: "NG", pos: [8.52, 12.0], score: 44, trend: "flat", comp: { Safety: 52, Humanitarian: 46, Worship: 40, Economy: 50 } },
  { name: "Egypt", flag: "🇪🇬", code: "EG", pos: [31.26, 30.05], score: 39, trend: "flat", comp: { Safety: 34, Humanitarian: 32, Worship: 38, Economy: 56 } },
  { name: "Türkiye", flag: "🇹🇷", code: "TR", pos: [28.98, 41.01], score: 35, trend: "down", comp: { Safety: 30, Humanitarian: 28, Worship: 22, Economy: 58 } },
  { name: "Indonesia", flag: "🇮🇩", code: "ID", pos: [106.85, -6.2], score: 29, trend: "down", comp: { Safety: 24, Humanitarian: 26, Worship: 20, Economy: 40 } },
  { name: "Bosnia & Herzegovina", flag: "🇧🇦", code: "BA", pos: [18.41, 43.86], score: 27, trend: "flat", comp: { Safety: 26, Humanitarian: 22, Worship: 30, Economy: 34 } },
  { name: "Malaysia", flag: "🇲🇾", code: "MY", pos: [101.69, 3.14], score: 23, trend: "flat", comp: { Safety: 18, Humanitarian: 20, Worship: 16, Economy: 30 } },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "SA", pos: [45.0, 24.0], score: 22, trend: "flat", comp: { Safety: 20, Humanitarian: 18, Worship: 14, Economy: 28 } },
  { name: "Sweden", flag: "🇸🇪", code: "SE", pos: [13.0, 55.6], score: 19, trend: "flat", comp: { Safety: 16, Humanitarian: 14, Worship: 34, Economy: 20 } },
  { name: "Canada", flag: "🇨🇦", code: "CA", pos: [-79.38, 43.65], score: 15, trend: "flat", comp: { Safety: 12, Humanitarian: 12, Worship: 22, Economy: 18 } },
];

type Src = [string, boolean];
interface EventSeed {
  id: number; cat: string; title: string; country: string; lat: number; lon: number;
  sev: string; t: number; what: string; why: string; status: string; keywords: string[];
  timeline: [string, string][]; sources: Src[]; rel: number[]; conflicting?: boolean;
  response?: unknown;
}

const EVENTS: EventSeed[] = [
  { id: 1, cat: "faith", title: "Dhul Hijjah moon sighted; Eid al-Adha date confirmed across Gulf states", country: "Saudi Arabia", lat: 24.47, lon: 39.61, sev: "medium", t: now - 2 * H,
    what: "Regional moon-sighting committees confirmed the Dhul Hijjah crescent this evening, fixing the date of Eid al-Adha and the Day of Arafah for pilgrims and communities worldwide.",
    why: "Over a billion Muslims coordinate fasting, travel and celebration around this announcement. Hajj logistics for two million pilgrims key off the confirmed date.",
    status: "Official announcements published; several European councils expected to align within 24 hours.",
    keywords: ["eid", "moon", "hajj", "dhul hijjah", "announcement"],
    timeline: [["2h ago", "Crescent reported by committees in Tumair and Sudair"], ["1h ago", "Supreme Court confirms sighting"], ["45m ago", "Neighbouring states align dates"], ["Now", "Global announcements ongoing"]],
    sources: [["Saudi Press Agency", true], ["Gulf News", true], ["Moonsighting.com", false]], rel: [7, 12] },
  { id: 2, cat: "humanitarian", title: "Flash floods displace 40,000 in Sindh; relief convoys en route", country: "Pakistan", lat: 26.06, lon: 68.94, sev: "critical", t: now - 5 * H,
    what: "Monsoon flash flooding along the Indus has submerged villages across three districts of Sindh, displacing an estimated 40,000 people and cutting two major roads.",
    why: "The region is still recovering from the 2022 floods; embankments remain fragile and displaced families have little buffer. Early aid decides outcomes in the first 72 hours.",
    status: "NDMA and Al-Khidmat convoys en route; two relief camps operational, four more being established.",
    keywords: ["flood", "pakistan", "sindh", "monsoon", "relief", "displacement"],
    timeline: [["9h ago", "Heavy overnight rainfall breaches canal embankment"], ["7h ago", "First displacement reports from Dadu district"], ["5h ago", "NDMA declares emergency in three districts"], ["1h ago", "First relief camp operational"]],
    sources: [["Dawn", true], ["NDMA Pakistan", true], ["Al Jazeera", true]], rel: [9, 4],
    response: { phase: "response",
      responders: [{ name: "Al-Khidmat Foundation", type: "relief", note: "2 relief camps operational", verified: true }, { name: "NDMA Pakistan", type: "official", note: "Coordinating rescue in 3 districts", verified: true }, { name: "Islamic Relief", type: "relief", note: "Food & clean-water kits", verified: true }, { name: "Edhi Foundation", type: "rescue", note: "Boat rescue teams deployed", verified: true }],
      donate: [{ org: "Al-Khidmat Foundation", appeal: "Sindh Flood Relief", note: "Ration & tent packages", verified: true, suggestedAmount: 5000 }, { org: "Islamic Relief", appeal: "Pakistan Emergency", note: "100% donation policy", verified: true, suggestedAmount: 10000 }],
      volunteer: "Local to Sindh? Camps need drivers and medics — register via NDMA.",
      dua: "for the displaced families of Sindh — for dry shelter, clean water, and relief that reaches the furthest villages before nightfall." } },
  { id: 3, cat: "conflict", title: "Aid corridor into northern Gaza reopens after week-long closure", country: "Palestine", lat: 31.53, lon: 34.45, sev: "critical", t: now - 3 * H,
    what: "A humanitarian corridor into northern Gaza reopened this morning, allowing the first convoy of food and medical supplies in seven days to reach field hospitals.",
    why: "Hundreds of thousands in the north depend entirely on convoy access for food, water purification and trauma care. Week-long gaps push clinics past capacity.",
    status: "18 trucks crossed by midday; agencies pressing for a sustained daily schedule.",
    keywords: ["gaza", "palestine", "aid", "corridor", "convoy"],
    timeline: [["7d ago", "Corridor closed amid escalation"], ["2d ago", "Negotiations resume via mediators"], ["3h ago", "Corridor reopens; first trucks cross"], ["Now", "UN agencies coordinating onward distribution"]],
    sources: [["UN OCHA", true], ["Reuters", true], ["Middle East Eye", false]], rel: [10, 2],
    response: { phase: "response",
      responders: [{ name: "UN OCHA", type: "official", note: "Coordinating convoy access", verified: true }, { name: "UNRWA", type: "relief", note: "Distributing to field hospitals", verified: true }, { name: "Palestine Red Crescent", type: "medical", note: "Trauma care in the north", verified: true }, { name: "Islamic Relief", type: "relief", note: "Food parcels & water units", verified: true }],
      donate: [{ org: "Palestine Red Crescent", appeal: "Emergency Medical Fund", note: "Trauma & ambulance support", verified: true, suggestedAmount: 7500 }, { org: "Islamic Relief", appeal: "Palestine Emergency Appeal", note: "Food, water & medical aid", verified: true, suggestedAmount: 10000 }],
      dua: "for the people of Gaza — for protection, for sustained aid through the corridor, and for a lasting, just peace." } },
  { id: 4, cat: "humanitarian", title: "Cholera alert in displacement camps around El Fasher", country: "Sudan", lat: 13.63, lon: 25.35, sev: "high", t: now - 11 * H,
    what: "Health workers report a spike in suspected cholera cases in camps hosting families displaced by the Darfur conflict, with water treatment supplies running low.",
    why: "Camp density and damaged water infrastructure make outbreaks fast-moving. Oral rehydration and chlorination in the first days sharply cut mortality.",
    status: "MSF assessment team on site; emergency chlorination beginning in two camps.",
    keywords: ["sudan", "cholera", "darfur", "camps", "health"],
    timeline: [["2d ago", "Clinics flag unusual diarrhoeal caseload"], ["11h ago", "Cholera alert issued for three camps"], ["4h ago", "MSF team arrives"], ["Now", "Chlorination under way"]],
    sources: [["MSF", true], ["Sudan Tribune", false], ["WHO", true]], rel: [2, 3],
    response: { phase: "response",
      responders: [{ name: "MSF", type: "medical", note: "Emergency chlorination in 2 camps", verified: true }, { name: "WHO", type: "official", note: "Cholera response coordination", verified: true }, { name: "Islamic Relief", type: "relief", note: "Clean-water & ORS kits", verified: true }],
      donate: [{ org: "MSF", appeal: "Sudan Emergency", note: "Cholera treatment & water", verified: true, suggestedAmount: 6000 }, { org: "Human Appeal", appeal: "Sudan Crisis Fund", note: "Water & sanitation", verified: true, suggestedAmount: 5000 }],
      dua: "for the displaced of Darfur — for clean water, for health in the camps, and for the safety of aid workers." } },
  { id: 5, cat: "community", title: "Malmö's largest purpose-built mosque opens after 12-year effort", country: "Sweden", lat: 55.60, lon: 13.00, sev: "low", t: now - 8 * H,
    what: "The new central mosque in Malmö opened its doors for Friday prayers, completing a 12-year community fundraising and construction effort with capacity for 2,000 worshippers.",
    why: "It anchors one of Scandinavia's largest Muslim communities with prayer space, a weekend school and an interfaith visitor centre — a model other Nordic cities are watching.",
    status: "Open daily; public open-house weekend planned for neighbours and city officials.",
    keywords: ["mosque", "sweden", "malmö", "opening", "community"],
    timeline: [["2014", "Land secured and fundraising begins"], ["2022", "Construction starts"], ["8h ago", "Inaugural Jumu'ah held"], ["This weekend", "Public open house"]],
    sources: [["SVT", true], ["Anadolu Agency", true]], rel: [13, 11] },
  { id: 6, cat: "economy", title: "Indonesia prices $2.4bn sovereign sukuk to fund green infrastructure", country: "Indonesia", lat: -6.2, lon: 106.85, sev: "medium", t: now - 14 * H,
    what: "Indonesia priced a $2.4bn dual-tranche sovereign sukuk, with proceeds earmarked for renewable energy and sustainable transport projects under its green framework.",
    why: "It's one of the largest green sukuk to date and a signal of how Islamic finance is scaling climate investment across Southeast Asia.",
    status: "Order book closed 3x oversubscribed; settlement expected within the week.",
    keywords: ["sukuk", "islamic finance", "indonesia", "green", "investment"],
    timeline: [["3d ago", "Roadshow concludes"], ["14h ago", "Pricing announced"], ["Now", "Allocation to investors"]],
    sources: [["Reuters", true], ["IFN — Islamic Finance News", true]], rel: [14, 5] },
  { id: 7, cat: "faith", title: "Two million pilgrims begin arriving in Makkah as Hajj season opens", country: "Saudi Arabia", lat: 21.42, lon: 39.83, sev: "medium", t: now - 20 * H,
    what: "Hajj terminals in Jeddah and Madinah moved to full capacity as the first waves of an expected two million pilgrims arrived for this year's Hajj.",
    why: "The annual pilgrimage is the largest recurring gathering on earth; heat-safety planning and crowd logistics affect millions of families following from home.",
    status: "Arrivals ahead of schedule; new shaded walkways and misting corridors operational at Mina.",
    keywords: ["hajj", "makkah", "pilgrims", "umrah"],
    timeline: [["3d ago", "Hajj terminals open"], ["20h ago", "Daily arrivals pass 80,000"], ["Now", "Camps at Mina receiving groups"]],
    sources: [["Saudi Press Agency", true], ["Arab News", true]], rel: [1, 12] },
  { id: 8, cat: "education", title: "Al-Azhar and Oxford launch joint fellowship in Islamic manuscript studies", country: "Egypt", lat: 30.05, lon: 31.26, sev: "low", t: now - 26 * H,
    what: "Al-Azhar University and Oxford announced a funded fellowship programme pairing scholars to digitise and study rare Islamic manuscripts held in both collections.",
    why: "Thousands of at-risk manuscripts across the region remain uncatalogued; the programme trains a new generation in conservation and opens archives to global researchers.",
    status: "First cohort of 12 fellows announced; applications for next year open in autumn.",
    keywords: ["education", "al-azhar", "oxford", "manuscripts", "scholarship", "research"],
    timeline: [["26h ago", "Programme announced in Cairo"], ["Now", "First cohort begins induction"]],
    sources: [["Al-Ahram", true], ["University of Oxford", true]], rel: [15, 5] },
  { id: 9, cat: "humanitarian", title: "Aftershocks hamper rescue efforts in eastern Afghanistan quake zone", country: "Afghanistan", lat: 34.42, lon: 70.45, sev: "high", t: now - 30 * H, conflicting: true,
    what: "A magnitude 5.9 earthquake near the Kunar valley destroyed hundreds of homes; continuing aftershocks are slowing search teams in remote villages.",
    why: "Mountain villages are hours from paved roads and winter stocks were already thin. Helicopter access and cash assistance are the fastest effective responses.",
    status: "Turkish and Qatari search teams deployed; UN airlifting shelter kits to Jalalabad.",
    keywords: ["earthquake", "afghanistan", "rescue", "aftershock"],
    timeline: [["30h ago", "M5.9 quake strikes Kunar province"], ["24h ago", "First casualty reports"], ["10h ago", "International teams arrive"], ["Now", "Aftershocks continue; assessments ongoing"]],
    sources: [["OCHA", true], ["TOLOnews", false], ["AFP", true]], rel: [2, 4],
    response: { phase: "response",
      responders: [{ name: "UN OCHA", type: "official", note: "Airlifting shelter kits to Jalalabad", verified: true }, { name: "Turkish AFAD", type: "rescue", note: "Search & rescue teams on site", verified: true }, { name: "Qatar Red Crescent", type: "medical", note: "Medical airlift underway", verified: true }, { name: "Islamic Relief", type: "relief", note: "Winterised shelter kits", verified: true }],
      donate: [{ org: "Islamic Relief", appeal: "Afghanistan Earthquake Appeal", note: "£85 = winterised tent", verified: true, suggestedAmount: 8500 }, { org: "Human Appeal", appeal: "Emergency Shelter Fund", note: "Blankets & shelter", verified: true, suggestedAmount: 5000 }],
      volunteer: "Diaspora skills drive — engineers & medics can register with Qatar Red Crescent.",
      dua: "for the families of Kunar — for shelter before the cold sets in, and for the safety of the rescue teams reaching remote villages." } },
  { id: 10, cat: "conflict", title: "Ceasefire monitors report calmest week in months across southern Lebanon", country: "Lebanon", lat: 33.27, lon: 35.20, sev: "medium", t: now - 16 * H,
    what: "International monitors recorded the lowest number of ceasefire violations since the truce began, as displaced families continue returning to border villages.",
    why: "Sustained calm determines whether tens of thousands of displaced residents can rebuild before winter and whether schools in the south reopen on schedule.",
    status: "Returns continuing; UNIFIL patrols expanded to two additional sectors.",
    keywords: ["lebanon", "ceasefire", "displacement", "returns"],
    timeline: [["6mo ago", "Truce takes effect"], ["1w ago", "Violation count begins falling"], ["16h ago", "Monitors publish weekly report"], ["Now", "Returns ongoing"]],
    sources: [["UNIFIL", true], ["L'Orient-Le Jour", true]], rel: [3, 2],
    response: { phase: "recovery",
      responders: [{ name: "UNIFIL", type: "official", note: "Monitoring returns & de-mining", verified: true }, { name: "Lebanese Red Cross", type: "medical", note: "Supporting returnee villages", verified: true }, { name: "Islamic Relief", type: "relief", note: "Rebuilding & winter kits", verified: true }],
      donate: [{ org: "Islamic Relief", appeal: "Lebanon Recovery Fund", note: "Home repair & winter aid", verified: true, suggestedAmount: 5000 }],
      dua: "for those returning home in southern Lebanon — for safe rebuilding and a durable calm before the winter." } },
  { id: 11, cat: "community", title: "Nigeria's national Qur'an competition draws record 3,000 entrants", country: "Nigeria", lat: 12.0, lon: 8.52, sev: "low", t: now - 40 * H,
    what: "Kano is hosting the largest edition yet of Nigeria's national Qur'an memorisation competition, with 3,000 participants and finalists advancing to international rounds.",
    why: "The competition network funds hifz scholarships for hundreds of students each year and has become a major cultural event across West Africa.",
    status: "Quarter-finals under way; finals broadcast nationally this weekend.",
    keywords: ["quran", "competition", "nigeria", "hifz", "community"],
    timeline: [["1w ago", "Regional qualifiers conclude"], ["40h ago", "National rounds open in Kano"], ["This weekend", "Finals"]],
    sources: [["Daily Trust", true], ["TVC News", false]], rel: [5, 13] },
  { id: 12, cat: "faith", title: "Istanbul hosts world congress on moon-sighting standardisation", country: "Türkiye", lat: 41.01, lon: 28.98, sev: "low", t: now - 50 * H,
    what: "Astronomers and scholars from 40 countries convened in Istanbul to work toward shared criteria for crescent sighting and a coordinated global Islamic calendar.",
    why: "Divergent Eid dates split families and communities every year; a common framework has been debated for decades and momentum is building.",
    status: "Draft criteria under discussion; communiqué expected at close of congress.",
    keywords: ["moon sighting", "calendar", "istanbul", "conference", "eid"],
    timeline: [["50h ago", "Congress opens"], ["Now", "Working groups in session"], ["In 2 days", "Closing communiqué"]],
    sources: [["TRT World", true], ["Diyanet", true]], rel: [1, 7] },
  { id: 13, cat: "community", title: "Toronto Islamic school network breaks ground on tuition-free campus", country: "Canada", lat: 43.65, lon: -79.38, sev: "low", t: now - 60 * H,
    what: "A Toronto charity broke ground on a tuition-free Islamic school campus funded entirely by waqf endowment, planned to serve 600 students from 2028.",
    why: "It's one of the first fully endowment-funded Islamic schools in North America — a financing model other communities are studying closely.",
    status: "Construction begun; endowment at 85% of target.",
    keywords: ["school", "canada", "waqf", "education", "community"],
    timeline: [["2y ago", "Waqf campaign launched"], ["60h ago", "Groundbreaking ceremony"], ["2028", "Planned opening"]],
    sources: [["CBC", true], ["Muslim Link", false]], rel: [5, 8] },
  { id: 14, cat: "economy", title: "Halal food exports from Malaysia hit record quarter on Gulf demand", country: "Malaysia", lat: 3.14, lon: 101.69, sev: "low", t: now - 70 * H,
    what: "Malaysia reported its strongest quarter of halal food exports on record, driven by Gulf demand and new certification agreements with three importing countries.",
    why: "The global halal economy is projected in the trillions; certification harmonisation is quietly removing the sector's biggest trade barrier.",
    status: "Trade ministry projecting continued growth; new certification MoUs in negotiation.",
    keywords: ["halal", "malaysia", "exports", "economy", "trade"],
    timeline: [["70h ago", "Quarterly figures published"], ["Now", "Analysts revise annual outlook"]],
    sources: [["The Edge Malaysia", true], ["Salaam Gateway", true]], rel: [6, 5] },
  { id: 15, cat: "education", title: "Sarajevo university opens region's first Islamic art conservation lab", country: "Bosnia & Herzegovina", lat: 43.86, lon: 18.41, sev: "low", t: now - 80 * H,
    what: "The University of Sarajevo inaugurated a conservation laboratory dedicated to Ottoman-era manuscripts, calligraphy and textiles from across the Balkans.",
    why: "Much of the region's Islamic heritage was damaged or dispersed in the 1990s; the lab creates local capacity to restore it rather than sending works abroad.",
    status: "Lab operational; first restoration projects selected from Gazi Husrev-beg Library.",
    keywords: ["bosnia", "conservation", "heritage", "education", "manuscripts"],
    timeline: [["80h ago", "Lab inaugurated"], ["Now", "First projects begin"]],
    sources: [["Klix.ba", false], ["Balkan Insight", true]], rel: [8, 13] },
];

// ── Moderation queue: community/partner submissions awaiting review ──────────
interface ModSeed {
  id: number; cat: string; country: string; sev: string; title: string;
  submitter: string; submittedMinsAgo: number; trustScore: number; mediaCount: number;
  flagged: boolean; conflicting: boolean; checks: { label: string; detail: string; ok: boolean }[];
  aiVerdict: string; body: string; sources: { name: string; verified: boolean; badge: string }[];
}
const MODERATION: ModSeed[] = [
  { id: 1, cat: "conflict", country: "Sudan", sev: "critical", title: "Shelling reported within 2km of UN-designated civilian shelters near El Fasher", submitter: "field-desk-04", submittedMinsAgo: 8, trustScore: 92, mediaCount: 3, flagged: false, conflicting: false,
    checks: [{ label: "Source reputation", detail: "Tier-1 verified outlet", ok: true }, { label: "Cross-referenced", detail: "3 independent reports", ok: true }, { label: "Location match", detail: "Geotag ↔ claim aligned", ok: true }, { label: "Media authenticity", detail: "No manipulation detected", ok: true }],
    aiVerdict: "High confidence. Corroborated by three Tier-1 sources with matching geolocation and timestamps. Satellite imagery independently confirms artillery activity in the described zone. Recommend approval with critical alert priority.",
    body: "Multiple field sources report sustained artillery fire beginning at approximately 04:30 local time, with impacts recorded within two kilometres of shelters housing an estimated 15,000 displaced persons. Humanitarian coordinators have suspended movement in and out of the northern sector.",
    sources: [{ name: "Radio Dabanga", verified: true, badge: "Tier 1" }, { name: "OCHA Sudan Situation Report", verified: true, badge: "Official" }, { name: "Sentinel-2 satellite pass", verified: true, badge: "Imagery" }] },
  { id: 2, cat: "humanitarian", country: "Afghanistan", sev: "high", title: "Aftershock damages newly-erected shelter camp in Kunar valley, casualties unconfirmed", submitter: "partner-ngo-reliefaid", submittedMinsAgo: 22, trustScore: 64, mediaCount: 5, flagged: true, conflicting: true,
    checks: [{ label: "Source reputation", detail: "Mixed — one unverified", ok: false }, { label: "Cross-referenced", detail: "2 reports, figures differ", ok: false }, { label: "Location match", detail: "Geotag ↔ claim aligned", ok: true }, { label: "Media authenticity", detail: "No manipulation detected", ok: true }],
    aiVerdict: 'Medium confidence. Event location and occurrence are well-supported, but casualty figures range from "several injured" to "dozens" across sources. Recommend approving the event while editing the headline to avoid unverified numbers, or holding for a second confirmation.',
    body: "A magnitude 4.8 aftershock struck the Kunar valley overnight, reportedly collapsing several tents at a shelter site established after last month's earthquake. Local partners describe injuries but casualty counts are inconsistent.",
    sources: [{ name: "TOLOnews", verified: true, badge: "Tier 2" }, { name: "ReliefAid field report", verified: false, badge: "Unverified" }] },
  { id: 3, cat: "economy", country: "Indonesia", sev: "low", title: "Indonesia prices record $2.5B sovereign green sukuk, 3× oversubscribed", submitter: "auto-ingest-reuters", submittedMinsAgo: 41, trustScore: 96, mediaCount: 1, flagged: false, conflicting: false,
    checks: [{ label: "Source reputation", detail: "Tier-1 wire service", ok: true }, { label: "Cross-referenced", detail: "4 financial outlets", ok: true }, { label: "Data consistency", detail: "Figures match filing", ok: true }, { label: "Media authenticity", detail: "Official chart only", ok: true }],
    aiVerdict: "Very high confidence. Routine financial announcement corroborated by four outlets and the official prospectus filing. Low severity — safe for auto-approval. No editorial changes needed.",
    body: "The government priced its largest green sukuk to date, with the order book closing three times oversubscribed. Proceeds are earmarked for renewable energy and sustainable transport projects.",
    sources: [{ name: "Reuters", verified: true, badge: "Tier 1" }, { name: "IFN — Islamic Finance News", verified: true, badge: "Sector" }, { name: "Ministry of Finance filing", verified: true, badge: "Official" }] },
  { id: 4, cat: "faith", country: "Saudi Arabia", sev: "medium", title: "Viral post claims new Hajj quota rules; officials have not confirmed", submitter: "community-tip-anon", submittedMinsAgo: 60, trustScore: 38, mediaCount: 2, flagged: true, conflicting: false,
    checks: [{ label: "Source reputation", detail: "Anonymous social post", ok: false }, { label: "Cross-referenced", detail: "No official confirmation", ok: false }, { label: "Location match", detail: "Unverifiable", ok: false }, { label: "Media authenticity", detail: "Screenshot, no primary", ok: false }],
    aiVerdict: "Low confidence — high misinformation risk. The claim originates from an anonymous social media account and is not confirmed by the Ministry of Hajj or any Tier-1 outlet. Recommend rejection, or holding pending official statement. Publishing unverified quota rumours could cause real harm to pilgrims.",
    body: "A widely-shared social media post alleges sweeping changes to national Hajj allocation criteria taking effect this season. No official channel has issued a corresponding statement, and the phrasing closely matches a debunked rumour from a prior year.",
    sources: [{ name: "Anonymous social account", verified: false, badge: "Unverified" }, { name: "Ministry of Hajj (checked)", verified: false, badge: "No match" }] },
  { id: 5, cat: "community", country: "Nigeria", sev: "low", title: "Kano's national Qur'an memorisation competition draws record 3,000 entrants", submitter: "stringer-westafrica", submittedMinsAgo: 120, trustScore: 88, mediaCount: 8, flagged: false, conflicting: false,
    checks: [{ label: "Source reputation", detail: "Established regional", ok: true }, { label: "Cross-referenced", detail: "2 outlets + organiser", ok: true }, { label: "Location match", detail: "Venue confirmed", ok: true }, { label: "Media authenticity", detail: "Event photos verified", ok: true }],
    aiVerdict: "High confidence. Positive community event confirmed by two regional outlets and the organising body. Media checks pass. Recommend approval — good candidate for the community highlights feed.",
    body: "Kano is hosting the largest edition yet of the national Qur'an memorisation competition, with 3,000 participants and finalists advancing to international rounds.",
    sources: [{ name: "Daily Trust", verified: true, badge: "Tier 2" }, { name: "TVC News", verified: true, badge: "Broadcast" }, { name: "Organising committee", verified: true, badge: "Primary" }] },
  { id: 6, cat: "education", country: "Egypt", sev: "low", title: "Al-Azhar and Oxford launch joint fellowship in Islamic manuscript studies", submitter: "auto-ingest-alahram", submittedMinsAgo: 180, trustScore: 94, mediaCount: 2, flagged: false, conflicting: false,
    checks: [{ label: "Source reputation", detail: "Tier-1 + institutional", ok: true }, { label: "Cross-referenced", detail: "Both universities", ok: true }, { label: "Data consistency", detail: "Details align", ok: true }, { label: "Media authenticity", detail: "Official photos", ok: true }],
    aiVerdict: "Very high confidence. Announced jointly by both institutions and reported by Al-Ahram. No concerns. Recommend approval for the education stream.",
    body: "Al-Azhar University and Oxford announced a funded fellowship programme pairing scholars to digitise and study rare Islamic manuscripts held in both collections. The first cohort of 12 fellows has been named.",
    sources: [{ name: "Al-Ahram", verified: true, badge: "Tier 1" }, { name: "University of Oxford", verified: true, badge: "Official" }] },
];

async function main() {
  // Idempotent reset (dev only).
  await prisma.source.deleteMany();
  await prisma.event.deleteMany();
  await prisma.moderationItem.deleteMany();
  await prisma.country.deleteMany();

  for (const c of COUNTRIES) {
    await prisma.country.create({
      data: {
        name: c.name, flag: c.flag, code: c.code, lon: c.pos[0], lat: c.pos[1],
        score: c.score, trend: c.trend, components: JSON.stringify(c.comp),
      },
    });
  }

  for (const e of EVENTS) {
    await prisma.event.create({
      data: {
        id: e.id, category: e.cat, title: e.title, countryName: e.country,
        lat: e.lat, lon: e.lon, severity: e.sev, timestamp: new Date(e.t),
        what: e.what, why: e.why, status: e.status,
        keywords: JSON.stringify(e.keywords),
        timeline: JSON.stringify(e.timeline.map(([at, text]) => ({ at, text }))),
        related: JSON.stringify(e.rel), conflicting: !!e.conflicting, pending: false,
        response: e.response ? JSON.stringify(e.response) : null,
        sources: {
          create: e.sources.map(([name, verified]) => ({ name, verified })),
        },
      },
    });
  }

  for (const m of MODERATION) {
    await prisma.moderationItem.create({
      data: {
        id: m.id, category: m.cat, countryName: m.country, severity: m.sev, title: m.title,
        submitter: m.submitter, submittedAt: new Date(now - m.submittedMinsAgo * 60_000),
        trustScore: m.trustScore, mediaCount: m.mediaCount, flagged: m.flagged, conflicting: m.conflicting,
        checks: JSON.stringify(m.checks), aiVerdict: m.aiVerdict, body: m.body,
        sources: JSON.stringify(m.sources), decision: null,
      },
    });
  }

  // Dev/staging convenience only: an admin account so the moderation queue
  // is testable without manually flipping a role in the DB. Never runs
  // against a production database — moderator/admin accounts there should
  // be granted deliberately, not via seed data.
  if (process.env.NODE_ENV !== "production") {
    const email = "admin@ummahmonitor.dev";
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: "Dev Admin",
          passwordHash: await bcrypt.hash("change-me-immediately", 10),
          authRole: "admin",
          onboarded: true,
        },
      });
      console.log(`Seeded dev admin: ${email} / change-me-immediately (change this password!)`);
    }
  }

  console.log(`Seeded ${COUNTRIES.length} countries, ${EVENTS.length} events, ${MODERATION.length} moderation items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
