import { getCountry } from "@/lib/repos";
import { ok, fail } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const country = await getCountry(decodeURIComponent(name));
  if (!country) return fail("Country not found", 404);
  return ok({ country });
}
