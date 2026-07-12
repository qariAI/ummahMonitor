// The core "context" thesis: don't just show an event, show what else is
// happening around it — other incidents, quakes, and current air traffic
// within a radius and (for time-stamped signals) a time window.
import { NextRequest } from "next/server";
import { listEvents } from "@/lib/repos";
import { fetchQuakes } from "@/lib/liveQuakes";
import { fetchFlights } from "@/lib/liveFlights";
import { haversineKm } from "@/lib/geo";
import { ok, fail } from "@/lib/http";
import type { EventDTO } from "@/lib/repos";
import type { QuakeMarker } from "@/lib/liveQuakes";
import type { FlightMarker } from "@/lib/liveFlights";

const DEFAULT_RADIUS_KM = 300;
const DEFAULT_WINDOW_HOURS = 72;

export interface ContextEvent {
  id: number;
  title: string;
  category: string;
  severity: string;
  country: string;
  distanceKm: number;
  timestamp: number;
}

export interface ContextQuake extends QuakeMarker {
  distanceKm: number;
}

export interface ContextFlight extends FlightMarker {
  distanceKm: number;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  const timestamp = Number(sp.get("timestamp")) || Date.now();
  const excludeEventId = sp.get("excludeEventId") ? Number(sp.get("excludeEventId")) : null;
  const radiusKm = Number(sp.get("radiusKm")) || DEFAULT_RADIUS_KM;
  const windowHours = Number(sp.get("windowHours")) || DEFAULT_WINDOW_HOURS;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return fail("lat and lon query params are required", 400);
  }

  const windowMs = windowHours * 3600_000;

  // ── Nearby events: public feed only, within radius + time window ─────────
  const allEvents = await listEvents({ publicOnly: true });
  const nearbyEvents: ContextEvent[] = allEvents
    .filter((e: EventDTO) => e.id !== excludeEventId)
    .filter((e: EventDTO) => Math.abs(e.timestamp - timestamp) <= windowMs)
    .map((e: EventDTO) => ({ ...e, distanceKm: haversineKm(lat, lon, e.lat, e.lon) }))
    .filter((e) => e.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      severity: e.severity,
      country: e.country,
      distanceKm: Math.round(e.distanceKm),
      timestamp: e.timestamp,
    }));

  // ── Nearby quakes: live USGS feed, within radius + time window ───────────
  const allQuakes = await fetchQuakes();
  const nearbyQuakes: ContextQuake[] = (allQuakes ?? [])
    .filter((q) => Math.abs(q.time - timestamp) <= windowMs)
    .map((q) => ({ ...q, distanceKm: haversineKm(lat, lon, q.lat, q.lon) }))
    .filter((q) => q.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);

  // ── Current air traffic nearby: live snapshot, radius only (flights are
  // live positions, not historical — there's no "time window" to apply). ───
  const flightResult = await fetchFlights();
  const nearbyFlights: ContextFlight[] = (flightResult?.flights ?? [])
    .map((f) => ({ ...f, distanceKm: haversineKm(lat, lon, f.lat, f.lon) }))
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);

  return ok({
    radiusKm,
    windowHours,
    nearbyEvents,
    nearbyQuakes,
    nearbyFlights,
    flightsRateLimited: flightResult?.rateLimited ?? false,
    fetchedAt: Date.now(),
  });
}
