import "server-only";
import { cache } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { TOURNAMENT_ID } from "./fall-2026";
import type { TournamentData, TournamentMatch } from "./types";

// PGRST205 = table not in PostgREST's schema cache, 42P01 = undefined table.
const missingTable = (e: PostgrestError | null) => !!e && (e.code === "PGRST205" || e.code === "42P01");

const MATCH_COLUMNS =
  "id, kind, side1_a, side1_b, side2_a, side2_b, status, start_time, court, winner, score1, score2, created_at";

/** Everything moderators have entered for the tournament. */
export const getTournamentData = cache(async (): Promise<TournamentData> => {
  const [matches, info] = await Promise.all([
    db()
      .from("tournament_matches")
      .select(MATCH_COLUMNS)
      .eq("tournament_id", TOURNAMENT_ID)
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    db().from("tournaments").select("ended").eq("id", TOURNAMENT_ID).maybeSingle(),
  ]);

  // Before the migration runs, show the roster only (no fake matches).
  if (missingTable(matches.error)) return { ready: false, matches: [], ended: false, canEnd: false };
  if (matches.error) throw new Error(`Failed to load tournament: ${matches.error.message}`);
  // Migration 0007 not run yet: the tournament simply isn't ended.
  if (info.error && !missingTable(info.error)) throw new Error(`Failed to load tournament: ${info.error.message}`);

  return {
    ready: true,
    matches: matches.data as TournamentMatch[],
    ended: info.data?.ended === true,
    canEnd: !info.error,
  };
});
