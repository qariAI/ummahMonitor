import { getEvent } from "@/lib/repos";
import { ok, fail } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(Number(id));
  if (!event) return fail("Event not found", 404);
  return ok({ event });
}
