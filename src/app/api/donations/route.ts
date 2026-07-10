import { createDonationCheckout, settleDonation, getDonationProvider } from "@/lib/payments";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<{ org: string; appeal: string; amount: number; eventId?: number }>(req);
  if (!body?.org || !body?.appeal) return fail("Missing org/appeal");
  const user = await getSessionUser();
  const result = await createDonationCheckout({
    org: body.org,
    appeal: body.appeal,
    amount: Number(body.amount) || 5000,
    eventId: body.eventId,
    userId: user?.id,
  });
  return ok(result, { status: 201 });
}

// Settle a donation. Only valid for "stub" provider donations (dev mode, no
// Stripe key — there's no real money movement to verify, so the client is
// trusted). Real Stripe donations are settled exclusively by the signature-
// verified webhook at /api/webhooks/stripe; this route refuses to touch them,
// so nobody can mark a real charge "completed" without actually paying.
export async function PATCH(req: Request) {
  const body = await readJson<{ donationId: string; status: "completed" | "canceled" }>(req);
  if (!body?.donationId) return fail("Missing donationId");
  const provider = await getDonationProvider(body.donationId);
  if (!provider) return fail("Donation not found", 404);
  if (provider !== "stub")
    return fail("This donation can only be settled via Stripe webhook", 403);
  await settleDonation(body.donationId, body.status === "canceled" ? "canceled" : "completed");
  return ok({ settled: true });
}
