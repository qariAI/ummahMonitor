import { listCountries } from "@/lib/repos";
import { ok } from "@/lib/http";

export async function GET() {
  return ok({ countries: await listCountries() });
}
