// Donation / payment integration for the Respond module's "Give →" actions.
// Real Stripe Checkout when STRIPE_SECRET_KEY is set; otherwise a stubbed dev
// checkout URL so the end-to-end flow (button → server → redirect → record) is
// exercisable without keys. Either way a Donation row is persisted.

import "server-only";
import Stripe from "stripe";
import { prisma } from "./db";

const KEY = process.env.STRIPE_SECRET_KEY || "";
const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/donate/success";
const CANCEL_URL = process.env.STRIPE_CANCEL_URL || "http://localhost:3000/donate/cancel";

const stripe = KEY ? new Stripe(KEY) : null;

export interface CheckoutInput {
  org: string;
  appeal: string;
  /** Amount in minor units (cents). */
  amount: number;
  currency?: string;
  eventId?: number;
  userId?: string;
}

export interface CheckoutResult {
  url: string;
  donationId: string;
  provider: "stripe" | "stub";
}

export async function createDonationCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const currency = (input.currency || "usd").toLowerCase();
  const amount = Math.max(100, Math.round(input.amount)); // floor $1.00

  const donation = await prisma.donation.create({
    data: {
      org: input.org,
      appeal: input.appeal,
      amount,
      currency,
      eventId: input.eventId ?? null,
      status: "pending",
      provider: stripe ? "stripe" : "stub",
      userId: input.userId ?? null,
    },
  });

  if (!stripe) {
    // Dev stub: mimic a hosted-checkout redirect that lands on success and
    // marks the donation completed via the success route.
    const url = `${SUCCESS_URL}?donation=${donation.id}&stub=1`;
    return { url, donationId: donation.id, provider: "stub" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `${input.org} — ${input.appeal}`,
            description: "Donation via UmmahMonitor Respond",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${SUCCESS_URL}?donation=${donation.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CANCEL_URL}?donation=${donation.id}`,
    metadata: { donationId: donation.id, org: input.org, appeal: input.appeal },
  });

  await prisma.donation.update({
    where: { id: donation.id },
    data: { providerRef: session.id },
  });

  return { url: session.url!, donationId: donation.id, provider: "stripe" };
}

/** Mark a donation completed/canceled. Called only from trusted contexts:
 *  the Stripe webhook (real payments) or the stub-checkout flow (dev/no
 *  Stripe key, where there is no real money movement to verify). */
export async function settleDonation(
  donationId: string,
  status: "completed" | "canceled",
): Promise<void> {
  await prisma.donation
    .update({ where: { id: donationId }, data: { status } })
    .catch(() => {});
}

/** Fetch a donation's provider, used to gate the client-callable settle path. */
export async function getDonationProvider(donationId: string): Promise<string | null> {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: { provider: true },
  });
  return donation?.provider ?? null;
}

export function isStripeConfigured(): boolean {
  return !!stripe;
}

export function getStripeClient(): Stripe | null {
  return stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
