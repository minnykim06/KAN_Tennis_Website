"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { recordFailedAttempt } from "@/lib/auth/lockout";
import { createSession, getCurrentPlayer } from "@/lib/auth/session";
import { changePasswordSchema, firstError } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Change the signed-in member's password. Needs the current one, like a sign-in would. */
export async function changePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const me = await getCurrentPlayer();
  if (!me) return { ok: false, error: "signInRequired" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirm: formData.get("newPasswordConfirm"),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { currentPassword, newPassword } = parsed.data;

  const { data: player, error } = await db()
    .from("players")
    .select("id, pin_hash, failed_attempts, locked_until")
    .eq("id", me.id)
    .single();
  if (error) return { ok: false, error: "generic" };

  // Same lockout as sign-in, so an open session can't be used to guess the password.
  if (player.locked_until && new Date(player.locked_until) > new Date()) return { ok: false, error: "locked" };
  if (!(await verifyPassword(currentPassword, player.pin_hash))) {
    return { ok: false, error: (await recordFailedAttempt(player)) ? "locked" : "wrongCurrentPassword" };
  }

  const pinHash = await hashPassword(newPassword);
  const { error: updateError } = await db()
    .from("players")
    .update({ pin_hash: pinHash, failed_attempts: 0, locked_until: null })
    .eq("id", me.id);
  if (updateError) return { ok: false, error: "generic" };

  // Other devices are now signed out (their sessions carry the old password); keep this one.
  await createSession(me.id, pinHash);
  revalidatePath("/", "layout");
  return { ok: true };
}
