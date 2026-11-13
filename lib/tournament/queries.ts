import "server-only";
import { cache } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { TOURNAMENT_ID, isValidDraw } from "./fall-2026";
import type { TournamentData, TournamentMatch } from "./types";

// PGRST205 = table not in PostgREST's schema cache, 42P01 = undefined table.
const missingTable = (e: PostgrestError | null) => !!e && (e.code === "PGRST205" || e.code === "42P01");

// PGRST204 / 42703 = column doesn't exist yet (migration 0008 not run).
const missingColumn = (e: PostgrestError | null) => !!e && (e.code === "42703" || e.code === "PGRST204");

const MATCH_COLUMNS =
  "id, kind, side1_a, side1_b, side2_a, side2_b, status, start_time, court, winner, score1, score2, created_at";

function loadMatches(withSlot: boolean) {
  return db()
    .from("tournament_matches")
    .select(withSlot ? `${MATCH_COLUMNS}, slot` : MATCH_COLUMNS)
    .eq("tournament_id", TOURNAMENT_ID)
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
}

function loadInfo(withDraw: boolean) {
  return db()
    .from("tournaments")
    .select(withDraw ? "ended, pair_letters" : "ended")
    .eq("id", TOURNAMENT_ID)
    .maybeSingle();
}

/** Everything moderators have entered for the tournament. */
export const getTournamentData = cache(async (): Promise<TournamentData> => {
  let [matches, info] = await Promise.all([loadMatches(true), loadInfo(true)]);
  // Older database without migration 0008: load without the draw columns.
  const canDraw = !missingColumn(matches.error) && !missingColumn(info.error);
  if (!canDraw) [matches, info] = await Promise.all([loadMatches(false), loadInfo(false)]);

  // Before the migration runs, show the roster only (no fake matches).
  if (missingTable(matches.error)) return { ready: false, matches: [], ended: false, canEnd: false, draw: null, canDraw: false };
  if (matches.error) throw new Error(`Failed to load tournament: ${matches.error.message}`);
  // Migration 0007 not run yet: the tournament simply isn't ended.
  if (info.error && !missingTable(info.error)) throw new Error(`Failed to load tournament: ${info.error.message}`);

  const row = info.data as { ended?: boolean; pair_letters?: unknown } | null;
  return {
    ready: true,
    matches: (matches.data as unknown as TournamentMatch[]).map((m) => ({ ...m, slot: m.slot ?? null })),
    ended: row?.ended === true,
    canEnd: !info.error,
    draw: isValidDraw(row?.pair_letters) ? row.pair_letters : null,
    canDraw: canDraw && !info.error,
  };
});
