"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { getCurrentPlayer, getModerator } from "@/lib/auth/session";
import { TOURNAMENT_ID, TOURNAMENT_PATH } from "@/lib/tournament/fall-2026";
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

  const { data, error } = await db()
    .from("tournament_matches")
    .update(parsed.data)
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
