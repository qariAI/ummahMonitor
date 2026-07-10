import { fetchFlights } from "@/lib/liveFlights";
import { ok, fail } from "@/lib/http";

export const revalidate = 30;

export async function GET() {
  const result = await fetchFlights();
  if (result === null) return fail("Failed to reach OpenSky", 502);
  return ok({ flights: result.flights, source: "OpenSky", rateLimited: result.rateLimited, fetchedAt: Date.now() });
}
