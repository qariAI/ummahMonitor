// Live aircraft positions over the Muslim world — OpenSky Network `/states/all`.
// Free, anonymous tier (no key): rate-limited (~400 requests/day per IP,
// ~10s min interval), so this is cached aggressively server-side.
//
// Lives in /lib rather than the route file — see liveQuakes.ts for why.
// Imported by both /api/live/flights and /api/context.
import { isInMuslimWorld, unionBbox } from "@/lib/muslimWorld";

export interface FlightMarker {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  altitudeM: number | null;
  velocityMs: number | null;
  headingDeg: number | null;
  onGround: boolean;
}

/** Fetch + normalize live OpenSky states over the Muslim world. Returns null
 *  on hard failure, { flights: [], rateLimited: true } if rate-limited
 *  (soft, not an error). */
export async function fetchFlights(): Promise<{ flights: FlightMarker[]; rateLimited: boolean } | null> {
  const [minLon, minLat, maxLon, maxLat] = unionBbox();
  const url =
    `https://opensky-network.org/api/states/all` +
    `?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;

  let data: any;
  try {
    const res = await fetch(url, { next: { revalidate: 30 } } as RequestInit);
    if (!res.ok) {
      if (res.status === 429) return { flights: [], rateLimited: true };
      return null;
    }
    data = await res.json();
  } catch {
    return null;
  }

  const flights: FlightMarker[] = (data?.states ?? [])
    .map((s: any[]): FlightMarker | null => {
      const [icao24, callsign, originCountry, , , lon, lat, , onGround, velocityMs, headingDeg, , , altitudeM] = s;
      if (typeof lat !== "number" || typeof lon !== "number") return null;
      return {
        icao24,
        callsign: (callsign || "").trim(),
        originCountry,
        lat,
        lon,
        altitudeM: typeof altitudeM === "number" ? altitudeM : null,
        velocityMs: typeof velocityMs === "number" ? velocityMs : null,
        headingDeg: typeof headingDeg === "number" ? headingDeg : null,
        onGround: !!onGround,
      };
    })
    .filter((f: FlightMarker | null): f is FlightMarker => f !== null)
    .filter((f: FlightMarker) => isInMuslimWorld(f.lat, f.lon));

  return { flights, rateLimited: false };
}
