export default function DonateCancelPage() {
  return (
    <main style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <h1>Checkout canceled</h1>
      <p style={{ opacity: 0.75, marginTop: 12 }}>No payment was made. You can try again anytime.</p>
      <a href="/" style={{ display: "inline-block", marginTop: 32 }}>
        ← Back to the map
      </a>
    </main>
  );
}
