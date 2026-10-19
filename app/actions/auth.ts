"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { recordFailedAttempt } from "@/lib/auth/lockout";
import { createSession, destroySession } from "@/lib/auth/session";
import { LANG_COOKIE, isLang } from "@/lib/i18n";
import { firstError, registerSchema, signInSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Escape LIKE wildcards so ilike() becomes a case-insensitive exact match. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, password } = parsed.data;

  // (The column is still called pin_hash from when sign-in used 4-digit PINs.)
  const { data: player, error } = await db()
    .from("players")
    .select("id, pin_hash, failed_attempts, locked_until")
    .ilike("name", escapeLike(name))
    .maybeSingle();
  if (error) return { ok: false, error: "generic" };

  if (player?.locked_until && new Date(player.locked_until) > new Date()) {
    return { ok: false, error: "locked" };
  }

  // Always run bcrypt, even for unknown names, so timing doesn't leak anything.
  const valid = await verifyPassword(password, player?.pin_hash ?? null);
  if (!player || !valid) {
    if (player && (await recordFailedAttempt(player))) return { ok: false, error: "locked" };
    return { ok: false, error: "invalidCredentials" };
  }

  if (player.failed_attempts > 0 || player.locked_until) {
    await db().from("players").update({ failed_attempts: 0, locked_until: null }).eq("id", player.id);
  }

  await createSession(player.id, player.pin_hash);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function register(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, password } = parsed.data;

  const pinHash = await hashPassword(password);
  const { data, error } = await db()
    .from("players")
    .insert({ name, pin_hash: pinHash })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation on lower(name)
    return { ok: false, error: error.code === "23505" ? "nameTaken" : "generic" };
  }

  await createSession(data.id, pinHash);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}

export async function setLanguage(lang: string): Promise<void> {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
