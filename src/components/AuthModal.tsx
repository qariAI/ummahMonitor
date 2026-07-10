"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useAuth, useToast } from "./Providers";

// Sign-in / sign-up. Drives real session persistence via /api/auth/*.
export function AuthModal({
  onClose,
  redirectAfterSignup = "/onboarding",
  onAuthed,
  defaultTab = "signin",
}: {
  onClose: () => void;
  /** Where signup navigates by default. Pass null to suppress and use onAuthed instead. */
  redirectAfterSignup?: string | null;
  /** Called after a successful signup OR login, instead of the default redirect. */
  onAuthed?: () => void;
  defaultTab?: "signin" | "signup";
}) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (tab === "signup") {
        await signup(name, email, password);
        toast("Account created — welcome");
        onClose();
        if (onAuthed) onAuthed();
        else if (redirectAfterSignup) router.push(redirectAfterSignup);
      } else {
        await login(email, password);
        toast("Signed in");
        onClose();
        onAuthed?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>{tab === "signin" ? "Welcome back" : "Join UmmahMonitor"}</h2>
      <p className="sub">
        {tab === "signin"
          ? "Sign in to submit reports, follow events, and moderate."
          : "Create an account to contribute to the live picture."}
      </p>
      <div className="tabs">
        <button className={tab === "signin" ? "on" : ""} onClick={() => setTab("signin")}>
          Sign in
        </button>
        <button className={tab === "signup" ? "on" : ""} onClick={() => setTab("signup")}>
          Sign up
        </button>
      </div>
      <form onSubmit={submit}>
        {tab === "signup" && (
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus={tab === "signin"}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder={tab === "signup" ? "At least 8 characters" : ""}
          />
        </div>
        {error && <p className="err">{error}</p>}
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? "…" : tab === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </Modal>
  );
}
