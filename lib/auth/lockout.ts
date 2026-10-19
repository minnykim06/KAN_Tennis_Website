import "server-only";
import { db } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/**
 * Count a wrong password (at sign-in or when changing it). After
 * MAX_FAILED_ATTEMPTS the account locks for LOCK_MINUTES. Returns true if it just locked.
 */
export async function recordFailedAttempt(player: { id: string; failed_attempts: number }): Promise<boolean> {
  const attempts = player.failed_attempts + 1;
  const locked = attempts >= MAX_FAILED_ATTEMPTS;
  await db()
    .from("players")
    .update({
      failed_attempts: locked ? 0 : attempts,
      locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
    })
    .eq("id", player.id);
  return locked;
}
