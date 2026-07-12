import { createReport, type ReportInput } from "@/lib/repos";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<ReportInput>(req);
  if (!body?.title || !body?.category || !body?.country)
    return fail("Missing required fields");
  const user = await getSessionUser();
  const result = await createReport({
    ...body,
    lat: Number(body.lat) || 0,
    lon: Number(body.lon) || 0,
    sources: (body.sources || []).filter((s) => s?.name),
    submitter: user?.email ?? "community-submission",
  });
  return ok(result, { status: 201 });
}
