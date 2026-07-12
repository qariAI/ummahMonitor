import { getEvent, getCountry } from "@/lib/repos";
import { generateBrief } from "@/lib/brief";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<{ eventId: number }>(req);
  if (!body?.eventId) return fail("Missing eventId");
  const event = await getEvent(Number(body.eventId));
  if (!event) return fail("Event not found", 404);
  const country = await getCountry(event.country);
  const brief = await generateBrief(event, country);
  return ok({ brief });
}
