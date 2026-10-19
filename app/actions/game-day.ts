"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { getModerator } from "@/lib/auth/session";
import { REGULAR_SCHEDULE } from "@/lib/constants";
import { nextOpenRegularDay } from "@/lib/queries";
import {
  firstError,
  formatError,
  gameDaySchema,
  idSchema,
  matchSchema,
  matchUpdateSchema,
  resultSchema,
} from "@/lib/validation";
import type { ActionResult, GameFormat } from "@/lib/types";

// Every action re-checks the session and role on the server: hiding buttons in
// the UI is not security, since server actions can be called directly.

type Prev = ActionResult | null;

const fields = (formData: FormData, ...keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, formData.get(k) ?? undefined]));

function done(): ActionResult {
  revalidatePath("/", "layout"); // rankings, home and game day all depend on this data
  return { ok: true };
}

function fail(error: PostgrestError | null, rows?: unknown[] | null): ActionResult | null {
  if (error) {
    console.error(error);
    // 23503 = foreign key violation (game day / player was deleted meanwhile)
    return { ok: false, error: error.code === "23503" ? "notFound" : "generic" };
  }
  if (rows && rows.length === 0) return { ok: false, error: "notFound" };
  return null;
}

const GAME_DAY_FIELDS = ["date", "start_time", "end_time", "location", "notes", "format"] as const;

// --- Game days --------------------------------------------------------------

export async function createGameDay(_prev: Prev, formData: FormData): Promise<ActionResult> {
  const mod = await getModerator();
  if (!mod) return { ok: false, error: "forbidden" };

  const parsed = gameDaySchema.safeParse(fields(formData, ...GAME_DAY_FIELDS));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { error } = await db().from("game_days").insert({ ...parsed.data, created_by: mod.id });
  return fail(error) ?? done();
}

/** One click: next Tuesday without a game day, 7–10 PM, Muir Tennis Courts, doubles. */
export async function createNextRegularGameDay(): Promise<ActionResult> {
  const mod = await getModerator();
  if (!mod) return { ok: false, error: "forbidden" };

  const date = await nextOpenRegularDay();
  const { error } = await db().from("game_days").insert({
    date,
    start_time: REGULAR_SCHEDULE.startTime,
    end_time: REGULAR_SCHEDULE.endTime,
    location: REGULAR_SCHEDULE.location,
    format: REGULAR_SCHEDULE.format,
    created_by: mod.id,
  });
  return fail(error) ?? done();
}

export async function updateGameDay(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const id = idSchema.safeParse(fields(formData, "id"));
  const parsed = gameDaySchema.safeParse(fields(formData, ...GAME_DAY_FIELDS));
  if (!id.success) return { ok: false, error: firstError(id.error) };
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  // Switching singles ↔ doubles would leave existing matchups with the wrong number of players.
  const current = await db().from("game_days").select("format, matches(count)").eq("id", id.data.id).maybeSingle();
  if (current.error) return fail(current.error)!;
  if (!current.data) return { ok: false, error: "notFound" };
  const matchCount = (current.data.matches as unknown as { count: number }[])[0]?.count ?? 0;
  if (current.data.format !== parsed.data.format && matchCount > 0) return { ok: false, error: "formatLocked" };

  const { data, error } = await db().from("game_days").update(parsed.data).eq("id", id.data.id).select("id");
  return fail(error, data) ?? done();
}

export async function deleteGameDay(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const id = idSchema.safeParse(fields(formData, "id"));
  if (!id.success) return { ok: false, error: firstError(id.error) };

  // Matches are removed by ON DELETE CASCADE.
  const { data, error } = await db().from("game_days").delete().eq("id", id.data.id).select("id");
  return fail(error, data) ?? done();
}

// --- Matches ----------------------------------------------------------------

async function gameDayFormat(gameDayId: string): Promise<GameFormat | null> {
  const { data } = await db().from("game_days").select("format").eq("id", gameDayId).maybeSingle();
  return (data?.format as GameFormat | undefined) ?? null;
}

const MATCH_FIELDS = ["player1_id", "player2_id", "partner1_id", "partner2_id", "court"] as const;

export async function createMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = matchSchema.safeParse(fields(formData, "game_day_id", ...MATCH_FIELDS));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const format = await gameDayFormat(parsed.data.game_day_id);
  if (!format) return { ok: false, error: "notFound" };
  const wrongFormat = formatError(format, parsed.data);
  if (wrongFormat) return { ok: false, error: wrongFormat };

  const { error } = await db().from("matches").insert(parsed.data);
  return fail(error) ?? done();
}

export async function updateMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = matchUpdateSchema.safeParse(fields(formData, "id", ...MATCH_FIELDS));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { id, ...values } = parsed.data;
  const { data: existing } = await db().from("matches").select("game_day_id").eq("id", id).maybeSingle();
  const format = existing && (await gameDayFormat(existing.game_day_id));
  if (!format) return { ok: false, error: "notFound" };
  const wrongFormat = formatError(format, values);
  if (wrongFormat) return { ok: false, error: wrongFormat };

  const { data, error } = await db().from("matches").update(values).eq("id", id).select("id");
  return fail(error, data) ?? done();
}

export async function deleteMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const id = idSchema.safeParse(fields(formData, "id"));
  if (!id.success) return { ok: false, error: firstError(id.error) };

  const { data, error } = await db().from("matches").delete().eq("id", id.data.id).select("id");
  return fail(error, data) ?? done();
}

/** Set, change or clear (result = "pending") a match result. */
export async function setMatchResult(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = resultSchema.safeParse(fields(formData, "id", "result", "score1", "score2"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { id, result, score } = parsed.data;
  const { data, error } = await db()
    .from("matches")
    .update({ result, score: result === "pending" ? null : score })
    .eq("id", id)
    .select("id");
  return fail(error, data) ?? done();
}
