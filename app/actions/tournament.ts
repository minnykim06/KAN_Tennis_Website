"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { getCurrentPlayer, getModerator } from "@/lib/auth/session";
import {
  LETTERS,
  PAIR_SCHEDULE,
  TEAMS,
  TOURNAMENT_ID,
  TOURNAMENT_PATH,
  getPair,
  isValidDraw,
} from "@/lib/tournament/fall-2026";
import {
  firstError,
  idSchema,
  tournamentMatchSchema,
  resultSchema,
  tournamentInProgressSchema,
  tournamentEndedSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

// Like game day: entering results needs a signed-in player; everything else is
// moderator-only. Every call re-checks the session and role on the server.
// None of these touch players, game days, matches or the general rankings.

type Prev = ActionResult | null;

const fields = (formData: FormData, ...keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, formData.get(k) ?? undefined]));

function done(): ActionResult {
  revalidatePath(TOURNAMENT_PATH);
  return { ok: true };
}

function fail(error: PostgrestError | null, rows?: unknown[] | null): ActionResult | null {
  if (error) {
    console.error(error);
    return { ok: false, error: "generic" };
  }
  if (rows && rows.length === 0) return { ok: false, error: "notFound" };
  return null;
}

async function isEnded(): Promise<boolean> {
  const { data } = await db().from("tournaments").select("ended").eq("id", TOURNAMENT_ID).maybeSingle();
  return data?.ended === true;
}

/** End the tournament (results become final for members), or reopen it. */
export async function setTournamentEnded(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = tournamentEndedSchema.safeParse(fields(formData, "ended"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const ended = parsed.data.ended;
  const now = new Date().toISOString();
  const { error } = await db()
    .from("tournaments")
    .upsert({ id: TOURNAMENT_ID, ended, ended_at: ended ? now : null, updated_at: now });
  return fail(error) ?? done();
}

/** 스페셜 페어 matchups are set in advance: only their results can change. */
async function isSpecialMatch(id: string): Promise<boolean> {
  const { data } = await db().from("tournament_matches").select("kind").eq("id", id).maybeSingle();
  return data?.kind === "special";
}

/** The match's draw slot (1–15), or null for a match that isn't from the draw. */
async function slotOf(id: string): Promise<number | null> {
  const { data, error } = await db().from("tournament_matches").select("slot").eq("id", id).maybeSingle();
  return error ? null : ((data?.slot as number | null | undefined) ?? null);
}

const MATCH_FIELDS = ["kind", "side1_a", "side1_b", "side2_a", "side2_b", "start_time", "court"] as const;

export async function createTournamentMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = tournamentMatchSchema.safeParse(fields(formData, ...MATCH_FIELDS));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.kind === "special") return { ok: false, error: "specialLocked" };

  const { error } = await db().from("tournament_matches").insert({ tournament_id: TOURNAMENT_ID, ...parsed.data });
  return fail(error) ?? done();
}

export async function updateTournamentMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const id = idSchema.safeParse(fields(formData, "id"));
  const parsed = tournamentMatchSchema.safeParse(fields(formData, ...MATCH_FIELDS));
  if (!id.success) return { ok: false, error: firstError(id.error) };
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.kind === "special" || (await isSpecialMatch(id.data.id))) return { ok: false, error: "specialLocked" };
  // Matches from the draw keep their pairs (change the draw instead): only time and court.
  const fromDraw = (await slotOf(id.data.id)) !== null;
  const values = fromDraw ? { start_time: parsed.data.start_time, court: parsed.data.court } : parsed.data;

  const { data, error } = await db()
    .from("tournament_matches")
    .update(values)
    .eq("id", id.data.id)
    .eq("tournament_id", TOURNAMENT_ID)
    .select("id");
  return fail(error, data) ?? done();
}

export async function deleteTournamentMatch(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const id = idSchema.safeParse(fields(formData, "id"));
  if (!id.success) return { ok: false, error: firstError(id.error) };
  if (await isSpecialMatch(id.data.id)) return { ok: false, error: "specialLocked" };
  if ((await slotOf(id.data.id)) !== null) return { ok: false, error: "scheduleLocked" };

  const { data, error } = await db()
    .from("tournament_matches")
    .delete()
    .eq("id", id.data.id)
    .eq("tournament_id", TOURNAMENT_ID)
    .select("id");
  return fail(error, data) ?? done();
}

/**
 * Enter, change or clear (result = "pending") a result, with the same fields as
 * a game day result. A result marks the match finished; clearing it puts the
 * match back to scheduled.
 */
export async function setTournamentResult(_prev: Prev, formData: FormData): Promise<ActionResult> {
  // Like game day: any signed-in player can enter or change a result, until a
  // moderator ends the tournament; after that, only moderators can.
  const player = await getCurrentPlayer();
  if (!player) return { ok: false, error: "signInRequired" };
  if (player.role !== "moderator" && (await isEnded())) return { ok: false, error: "tournamentEnded" };

  const parsed = resultSchema.safeParse(fields(formData, "id", "result", "score1", "score2"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { id, result, score } = parsed.data;
  const [score1, score2] = result !== "pending" && score ? score.split("-").map(Number) : [null, null];
  const winner = { pending: null, player1_win: "side1", player2_win: "side2", draw: "draw" }[result];

  const { data, error } = await db()
    .from("tournament_matches")
    .update({ status: result === "pending" ? "scheduled" : "final", winner, score1, score2 })
    .eq("id", id)
    .eq("tournament_id", TOURNAMENT_ID)
    .select("id");
  return fail(error, data) ?? done();
}

/** Mark a match without a result as in progress, or back to scheduled. */
export async function setTournamentInProgress(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const parsed = tournamentInProgressSchema.safeParse(fields(formData, "id", "in_progress"));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { id, in_progress: inProgress } = parsed.data;
  const { data, error } = await db()
    .from("tournament_matches")
    .update({ status: inProgress ? "in_progress" : "scheduled" })
    .eq("id", id)
    .eq("tournament_id", TOURNAMENT_ID)
    .neq("status", "final")
    .select("id");
  return fail(error, data) ?? done();
}

// --- 고정 페어 draw (제비뽑기) ------------------------------------------------

type SlotRow = {
  id: string;
  slot: number;
  side1_a: string;
  side1_b: string;
  side2_a: string;
  side2_b: string;
  status: string;
  winner: string | null;
  score1: number | null;
};

/**
 * Save which pair drew which letter (fields `black_A` … `white_E`, pair ids),
 * then create or update the 15 scheduled 고정 페어 matches to match. Once a
 * match has a result (or is in progress), its pairs can no longer change.
 */
export async function savePairDraw(_prev: Prev, formData: FormData): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const draw = Object.fromEntries(
    TEAMS.map((team) => [team.id, Object.fromEntries(LETTERS.map((l) => [l, String(formData.get(`${team.id}_${l}`) ?? "")]))]),
  );
  if (!isValidDraw(draw)) return { ok: false, error: "invalidDraw" };

  const { data: existing, error: loadError } = await db()
    .from("tournament_matches")
    .select("id, slot, side1_a, side1_b, side2_a, side2_b, status, winner, score1")
    .eq("tournament_id", TOURNAMENT_ID)
    .not("slot", "is", null);
  if (loadError) return fail(loadError)!;
  const bySlot = new Map((existing as SlotRow[]).map((m) => [m.slot, m]));

  const planned = PAIR_SCHEDULE.map(([b, w], i) => {
    const [s1a, s1b] = getPair(draw.black[b])!.members;
    const [s2a, s2b] = getPair(draw.white[w])!.members;
    return { slot: i + 1, side1_a: s1a.id, side1_b: s1b.id, side2_a: s2a.id, side2_b: s2b.id };
  });
  const changed = planned.filter((p) => {
    const m = bySlot.get(p.slot);
    return m && (m.side1_a !== p.side1_a || m.side1_b !== p.side1_b || m.side2_a !== p.side2_a || m.side2_b !== p.side2_b);
  });
  // Moving a played match to other pairs would hand its result to them.
  const started = (m: SlotRow) => m.status !== "scheduled" || m.winner !== null || m.score1 !== null;
  if (changed.some((p) => started(bySlot.get(p.slot)!))) return { ok: false, error: "drawLocked" };

  const { error: saveError } = await db()
    .from("tournaments")
    .upsert({ id: TOURNAMENT_ID, pair_letters: draw, updated_at: new Date().toISOString() });
  if (saveError) return fail(saveError)!;

  for (const p of changed) {
    const { error } = await db()
      .from("tournament_matches")
      .update({ side1_a: p.side1_a, side1_b: p.side1_b, side2_a: p.side2_a, side2_b: p.side2_b })
      .eq("id", bySlot.get(p.slot)!.id);
    if (error) return fail(error)!;
  }
  const missing = planned.filter((p) => !bySlot.has(p.slot));
  if (missing.length > 0) {
    const { error } = await db()
      .from("tournament_matches")
      .insert(missing.map((p) => ({ tournament_id: TOURNAMENT_ID, kind: "pair", ...p })));
    if (error) return fail(error)!;
  }
  return done();
}

/**
 * Clear the draw and delete the 15 matches it created. Refused while any of
 * them is in progress or has a result, so no score is lost.
 */
export async function resetPairDraw(): Promise<ActionResult> {
  if (!(await getModerator())) return { ok: false, error: "forbidden" };

  const { data, error: loadError } = await db()
    .from("tournament_matches")
    .select("id, slot, side1_a, side1_b, side2_a, side2_b, status, winner, score1")
    .eq("tournament_id", TOURNAMENT_ID)
    .not("slot", "is", null);
  if (loadError) return fail(loadError)!;
  const started = (m: SlotRow) => m.status !== "scheduled" || m.winner !== null || m.score1 !== null;
  if ((data as SlotRow[]).some(started)) return { ok: false, error: "drawResetLocked" };

  const { error: deleteError } = await db()
    .from("tournament_matches")
    .delete()
    .eq("tournament_id", TOURNAMENT_ID)
    .not("slot", "is", null);
  if (deleteError) return fail(deleteError)!;

  const { error } = await db()
    .from("tournaments")
    .update({ pair_letters: null, updated_at: new Date().toISOString() })
    .eq("id", TOURNAMENT_ID);
  return fail(error) ?? done();
}
