// Return page after checkout. This page is purely informational — it never
// marks the donation "completed" itself. For real Stripe payments that
// happens via the signature-verified /api/webhooks/stripe route, which is
// typically faster than the browser redirect anyway. For the keyless dev
// stub, GiveSheet already settled the donation before redirecting here.

export default function DonateSuccessPage({
  searchParams,
}: {
  searchParams: { donation?: string; stub?: string };
}) {
  return (
    <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <h1>Jazak Allahu khairan</h1>
      <p style={{ opacity: 0.75, marginTop: 12 }}>
        Your donation is being processed. You&apos;ll see it reflected in your account shortly.
      </p>
      {searchParams.stub === "1" && (
        <p style={{ opacity: 0.5, fontSize: 13, marginTop: 24 }}>
          (Dev stub checkout — no real payment was made.)
        </p>
      )}
      <a href="/" style={{ display: "inline-block", marginTop: 32 }}>
        ← Back to the map
      </a>
    </main>
  );
}
