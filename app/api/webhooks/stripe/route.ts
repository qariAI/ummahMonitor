// Stripe webhook — the only place a real donation is ever marked "completed".
// Signature verification (via STRIPE_WEBHOOK_SECRET) proves the event came
// from Stripe, not from a client claiming a payment succeeded. Configure this
// URL (https://yourdomain.com/api/webhooks/stripe) in the Stripe dashboard
// or `stripe listen --forward-to localhost:3000/api/webhooks/stripe` locally,
// and copy the resulting signing secret into STRIPE_WEBHOOK_SECRET.

import { getStripeClient, settleDonation, STRIPE_WEBHOOK_SECRET } from "@/lib/payments";
import { fail } from "@/lib/http";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe) return fail("Stripe not configured", 500);
  if (!STRIPE_WEBHOOK_SECRET) return fail("Webhook secret not configured", 500);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return fail("Missing stripe-signature header", 400);

  // Signature verification requires the raw request body, not a parsed one.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return fail(`Webhook signature verification failed: ${message}`, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const donationId = session.metadata?.donationId;
      if (donationId && session.payment_status === "paid") {
        await settleDonation(donationId, "completed");
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const donationId = session.metadata?.donationId;
      if (donationId) await settleDonation(donationId, "canceled");
      break;
    }
    default:
      // Ignore other event types — nothing else affects donation status.
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
