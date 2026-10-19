import "server-only";
import { createHmac } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { CurrentPlayer } from "@/lib/types";

const COOKIE = "kan_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (use at least 32 random characters).");
  }
  return new TextEncoder().encode(value);
}

/**
 * A short fingerprint of the player's password hash. Sessions carry it, so
 * changing the password signs out every other device that used the old one.
 * It's an HMAC, so the cookie doesn't reveal anything about the hash.
 */
function passwordVersion(passwordHash: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "").update(passwordHash).digest("base64url").slice(0, 16);
}

export async function createSession(playerId: string, passwordHash: string): Promise<void> {
  const token = await new SignJWT({ pv: passwordVersion(passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(playerId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

async function readSession(): Promise<{ id: string; pv: unknown } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub ? { id: payload.sub, pv: payload.pv } : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in player, loaded fresh from the database (so role changes,
 * deletions and password changes take effect immediately). Memoized per request.
 */
export const getCurrentPlayer = cache(async (): Promise<CurrentPlayer | null> => {
  const session = await readSession();
  if (!session) return null;

  const { data, error } = await db()
    .from("players")
    .select("id, name, role, pin_hash")
    .eq("id", session.id)
    .maybeSingle();
  if (error || !data) return null;
  // Signed in before the password last changed → no longer valid.
  if (session.pv !== passwordVersion(data.pin_hash)) return null;
  return { id: data.id, name: data.name, role: data.role } as CurrentPlayer;
});

/** Returns the current player if they are a moderator, otherwise null. */
export async function getModerator(): Promise<CurrentPlayer | null> {
  const player = await getCurrentPlayer();
  return player?.role === "moderator" ? player : null;
}
