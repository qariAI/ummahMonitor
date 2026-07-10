// Auth with real, server-side session persistence.
// - Passwords hashed with bcrypt.
// - Sessions are opaque random tokens; only a SHA-256 hash is stored in the DB.
// - The raw token lives in an httpOnly, SameSite=Lax cookie signed (HMAC) with
//   SESSION_SECRET, so a tampered/forged cookie is rejected before any DB hit.
// Sessions survive process restarts because they are rows in the database, not
// in-memory state.

import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE = "um_session";
const SESSION_TTL_DAYS = 30;
const SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";

export interface OnboardingChannels {
  inapp: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  /** Authorization level: "user" | "moderator" | "admin". */
  authRole: string;
  onboarded: boolean;
  /** Onboarding job-title, e.g. Researcher/Journalist — unrelated to permissions. */
  role: string | null;
  categories: string[] | null;
  regions: string[] | null;
  severity: string;
  digest: string;
  channels: OnboardingChannels | null;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  authRole: string;
  onboarded: boolean;
  role: string | null;
  categories: string | null;
  regions: string | null;
  severity: string;
  digest: string;
  channels: string | null;
};

export function toSessionUser(u: UserRow): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    authRole: u.authRole,
    onboarded: u.onboarded,
    role: u.role,
    categories: u.categories ? JSON.parse(u.categories) : null,
    regions: u.regions ? JSON.parse(u.regions) : null,
    severity: u.severity,
    digest: u.digest,
    channels: u.channels ? JSON.parse(u.channels) : null,
  };
}

function sign(value: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  // Constant-time compare to avoid timing oracles.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** Create a session row and set the signed httpOnly cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  const store = await cookies();
  store.set(COOKIE, sign(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolve the current user from the request cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const token = unsign(raw);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

/** Revoke the current session (logout) and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) {
    const token = unsign(raw);
    if (token) {
      await prisma.session
        .deleteMany({ where: { tokenHash: hashToken(token) } })
        .catch(() => {});
    }
  }
  store.delete(COOKIE);
}

/** Throwing guard for protected routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

const MODERATOR_ROLES = new Set(["moderator", "admin"]);

/** True if the given authRole can review/decide moderation queue items. */
export function isModerator(authRole: string): boolean {
  return MODERATOR_ROLES.has(authRole);
}

/** Throwing guard for moderator/admin-only routes. */
export async function requireModerator(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  if (!isModerator(user.authRole)) throw new AuthError("Moderator access required");
  return user;
}

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}
