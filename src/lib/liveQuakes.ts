// Live earthquakes, M2.5+, past day — USGS GeoJSON feed. Free, no key,
// updates every ~1 minute on their end. Filtered to the Muslim-world bbox
// union so the map only surfaces quakes relevant to this product.
//
// Lives in /lib rather than the route file because Next.js route files
// (route.ts under app/api/**) may only export a fixed set of names (GET,
// POST, revalidate, etc.) — any other export fails the build. This is
// imported by both /api/live/quakes and /api/context.
import { isInMuslimWorld } from "@/lib/muslimWorld";

const USGS_FEED =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

export interface QuakeMarker {
  id: string;
  mag: number;
  place: string;
  lat: number;
  lon: number;
  depthKm: number;
  time: number; // epoch ms
  url: string;
}

/** Fetch + normalize the live USGS feed. Returns null on failure. */
export async function fetchQuakes(): Promise<QuakeMarker[] | null> {
  let data: any;
  try {
    const res = await fetch(USGS_FEED, { next: { revalidate: 60 } } as RequestInit);
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  return (data?.features ?? [])
    .map((f: any) => {
      const [lon, lat, depthKm] = f.geometry?.coordinates ?? [];
      return {
        id: f.id,
        mag: f.properties?.mag ?? 0,
        place: f.properties?.place ?? "Unknown location",
        lat,
        lon,
        depthKm,
        time: f.properties?.time ?? 0,
        url: f.properties?.url ?? "",
      };
    })
    .filter((q: QuakeMarker) => Number.isFinite(q.lat) && Number.isFinite(q.lon))
    .filter((q: QuakeMarker) => isInMuslimWorld(q.lat, q.lon))
    .sort((a: QuakeMarker, b: QuakeMarker) => b.time - a.time);
}
