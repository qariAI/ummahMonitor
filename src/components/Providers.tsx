"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/client";

// ── Auth context (session-backed) ───────────────────────────────────────────
export interface OnboardingChannels {
  inapp: boolean;
  email: boolean;
  whatsapp: boolean;
}
export interface OnboardingPrefs {
  role: string | null;
  categories: string[];
  regions: string[];
  severity: string;
  digest: string;
  channels: OnboardingChannels;
}
interface User {
  id: string;
  email: string;
  name: string;
  /** Authorization level: "user" | "moderator" | "admin". */
  authRole: string;
  onboarded: boolean;
  role: string | null;
  categories: string[] | null;
  regions: string[] | null;
  severity: string;
  digest: string;
  channels: OnboardingChannels | null;
}
interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (prefs: OnboardingPrefs) => Promise<void>;
}
const AuthContext = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};

// ── Toast context ───────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}
interface ToastCtx {
  toast: (message: string, undo?: () => void) => void;
}
const ToastContext = createContext<ToastCtx | null>(null);
export const useToast = () => {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToast outside provider");
  return c;
};

// ── Theme context ───────────────────────────────────────────────────────────
interface ThemeCtx {
  theme: "dark" | "light";
  toggle: () => void;
}
const ThemeContext = createContext<ThemeCtx | null>(null);
export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme outside provider");
  return c;
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: User | null }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { user } = await api<{ user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(async (prefs: OnboardingPrefs) => {
    const { user } = await api<{ user: User }>("/api/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(prefs),
    });
    setUser(user);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, undo?: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(t);
  }, []);
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("um-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const authValue = useMemo(
    () => ({ user, loading, refresh, login, signup, logout, completeOnboarding }),
    [user, loading, refresh, login, signup, logout, completeOnboarding],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <ThemeContext.Provider value={{ theme, toggle }}>
        <ToastContext.Provider value={{ toast }}>
          {children}
          <div className="toast-stack">
            {toasts.map((t) => (
              <div key={t.id} className="toast">
                <span className="toast-dot" />
                <span>{t.message}</span>
                {t.undo && (
                  <button
                    className="toast-undo"
                    onClick={() => {
                      t.undo?.();
                      setToasts((all) => all.filter((x) => x.id !== t.id));
                    }}
                  >
                    Undo
                  </button>
                )}
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
