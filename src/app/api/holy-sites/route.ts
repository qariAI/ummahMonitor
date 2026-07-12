// Live data for the Holy Sites screen. Every field here comes from a real
// source — no fabricated "crowd level" or "access status":
//   - Prayer times: Aladhan API (free, no key)
//   - Weather: Open-Meteo (free, no key)
//   - Nearby incidents: our own verified event feed (publicOnly), same
//     radius+time correlation used by /api/context — so Al-Aqsa's "nearby
//     incidents" is exactly the moderated, sourced event data elsewhere in
//     the product, not a scraped or invented status claim.
import { HOLY_SITES } from "@/lib/holySites";
import { listEvents } from "@/lib/repos";
import { haversineKm } from "@/lib/geo";
import { ok } from "@/lib/http";

const RADIUS_KM = 15;
const WINDOW_HOURS = 72;

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface SiteWeather {
  tempC: number;
  windKph: number;
}

export interface SiteIncident {
  id: number;
  title: string;
  category: string;
  severity: string;
  distanceKm: number;
  timestamp: number;
}

export interface HolySiteData {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  prayerTimes: PrayerTimes | null;
  weather: SiteWeather | null;
  nearbyIncidents: SiteIncident[];
}

async function fetchPrayerTimes(lat: number, lon: number): Promise<PrayerTimes | null> {
  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=4`;
    const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data?.data?.timings;
    if (!t) return null;
    // Aladhan returns "HH:mm (TZ)" — strip the timezone suffix.
    const clean = (s: string) => (s || "").split(" ")[0];
    return { fajr: clean(t.Fajr), dhuhr: clean(t.Dhuhr), asr: clean(t.Asr), maghrib: clean(t.Maghrib), isha: clean(t.Isha) };
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<SiteWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url, { next: { revalidate: 900 } } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    const cw = data?.current_weather;
    if (!cw) return null;
    return { tempC: cw.temperature, windKph: cw.windspeed };
  } catch {
    return null;
  }
}

export async function GET() {
  const allEvents = await listEvents({ publicOnly: true });
  const now = Date.now();
  const windowMs = WINDOW_HOURS * 3600_000;

  const sites: HolySiteData[] = await Promise.all(
    HOLY_SITES.map(async (site) => {
      const [prayerTimes, weather] = await Promise.all([
        fetchPrayerTimes(site.lat, site.lon),
        fetchWeather(site.lat, site.lon),
      ]);

      const nearbyIncidents: SiteIncident[] = allEvents
        .filter((e) => Math.abs(e.timestamp - now) <= windowMs)
        .map((e) => ({ ...e, distanceKm: haversineKm(site.lat, site.lon, e.lat, e.lon) }))
        .filter((e) => e.distanceKm <= RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 10)
        .map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          severity: e.severity,
          distanceKm: Math.round(e.distanceKm),
          timestamp: e.timestamp,
        }));

      return {
        id: site.id,
        name: site.name,
        city: site.city,
        country: site.country,
        lat: site.lat,
        lon: site.lon,
        timezone: site.timezone,
        prayerTimes,
        weather,
        nearbyIncidents,
      };
    }),
  );

  return ok({ sites, fetchedAt: Date.now() });
}
