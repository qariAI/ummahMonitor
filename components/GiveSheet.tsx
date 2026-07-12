"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Providers";
import { api, money } from "@/lib/client";

interface GiveTarget {
  org: string;
  appeal: string;
  note?: string;
  eventId?: number;
  suggestedAmount?: number;
}

const PRESETS = [2500, 5000, 10000, 25000];

// Real donation checkout (Stripe or keyless dev stub) for a "Give →" action.
export function GiveSheet({ target, onClose }: { target: GiveTarget; onClose: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(target.suggestedAmount ?? 5000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function give() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ url: string; provider: string }>("/api/donations", {
        method: "POST",
        body: JSON.stringify({
          org: target.org,
          appeal: target.appeal,
          amount,
          eventId: target.eventId,
        }),
      });
      if (res.provider === "stub") {
        toast(`Donation of ${money(amount)} to ${target.org} recorded (dev stub)`);
        // Settle the stubbed donation so it reflects "completed".
        const id = new URL(res.url, window.location.origin).searchParams.get("donation");
        if (id)
          await api("/api/donations", {
            method: "PATCH",
            body: JSON.stringify({ donationId: id, status: "completed" }),
          }).catch(() => {});
        onClose();
      } else {
        window.location.href = res.url; // hosted Stripe Checkout
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>Give to {target.org}</h2>
      <p className="sub">
        {target.appeal}
        {target.note ? ` · ${target.note}` : ""}
      </p>
      <div className="field">
        <label>Amount</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              style={
                amount === p
                  ? { borderColor: "var(--faith)", color: "var(--faith)" }
                  : undefined
              }
              onClick={() => setAmount(p)}
            >
              {money(p)}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          value={(amount / 100).toString()}
          onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
        />
      </div>
      {error && <p className="err">{error}</p>}
      <button className="btn-primary" disabled={busy} onClick={give}>
        {busy ? "…" : `Give ${money(amount)} →`}
      </button>
      <p className="ai-fallback" style={{ textAlign: "center", marginTop: 10 }}>
        Secured checkout. 100% of appeals shown are from verified responders.
      </p>
    </Modal>
  );
}
