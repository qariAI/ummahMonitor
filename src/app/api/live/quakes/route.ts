import { fetchQuakes } from "@/lib/liveQuakes";
import { ok, fail } from "@/lib/http";

export const revalidate = 60; // Next.js route cache: refetch upstream at most once/minute

export async function GET() {
  const quakes = await fetchQuakes();
  if (quakes === null) return fail("Failed to reach USGS feed", 502);
  return ok({ quakes, source: "USGS", fetchedAt: Date.now() });
}
