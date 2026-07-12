// Holy sites registry — coordinates + timezone are the only things we hardcode.
// Everything else (prayer times, weather, nearby incidents) is fetched live
// from real sources in /api/holy-sites. No fabricated metrics: we deliberately
// don't show a "crowd level" or "access status" field, since no free/reliable
// live source exists for either — inventing one would be presenting a guess
// as fact, which is exactly what this product's trust model exists to avoid.
export interface HolySite {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string; // IANA zone, e.g. "Asia/Riyadh"
}

export const HOLY_SITES: HolySite[] = [
  { id: "haram", name: "Masjid al-Haram", city: "Makkah", country: "Saudi Arabia", lat: 21.4225, lon: 39.8262, timezone: "Asia/Riyadh" },
  { id: "nabawi", name: "Masjid an-Nabawi", city: "Madinah", country: "Saudi Arabia", lat: 24.4672, lon: 39.6112, timezone: "Asia/Riyadh" },
  { id: "aqsa", name: "Al-Aqsa Mosque", city: "Jerusalem", country: "Palestine", lat: 31.7761, lon: 35.2358, timezone: "Asia/Jerusalem" },
  { id: "arafat", name: "Mount Arafat", city: "Makkah", country: "Saudi Arabia", lat: 21.3547, lon: 39.9839, timezone: "Asia/Riyadh" },
  { id: "mina", name: "Mina", city: "Makkah", country: "Saudi Arabia", lat: 21.4133, lon: 39.8933, timezone: "Asia/Riyadh" },
  { id: "muzdalifah", name: "Muzdalifah", city: "Makkah", country: "Saudi Arabia", lat: 21.3833, lon: 39.9361, timezone: "Asia/Riyadh" },
  { id: "quba", name: "Masjid Quba", city: "Madinah", country: "Saudi Arabia", lat: 24.4392, lon: 39.6172, timezone: "Asia/Riyadh" },
];
