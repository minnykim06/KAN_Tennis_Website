import "server-only";
import { cache } from "react";
import { db } from "./db";
import { computeRankings, type Standing } from "./ranking";
import { addDays, nextRegularDay, todayInPacific } from "./time";
import type { GameDay, Player } from "./types";

export const getPlayers = cache(async (): Promise<Player[]> => {
  const { data, error } = await db().from("players").select("id, name").order("name");
  if (error) throw new Error(`Failed to load players: ${error.message}`);
  return data;
});

export const getStandings = cache(async (): Promise<Standing[]> => {
  const [players, { data: matches, error }] = await Promise.all([
    getPlayers(),
    db().from("matches").select("player1_id, player2_id, partner1_id, partner2_id, result, score").neq("result", "pending"),
  ]);
  if (error) throw new Error(`Failed to load matches: ${error.message}`);
  return computeRankings(players, matches);
});

const GAME_DAY_COLUMNS =
  "id, date, start_time, end_time, location, notes, format, created_at, " +
  "matches (id, game_day_id, player1_id, player2_id, partner1_id, partner2_id, court, note, result, score, created_at)";

/** All game days with their matches, split into upcoming (soonest first) and past (latest first). */
export const getGameDays = cache(async (): Promise<{ upcoming: GameDay[]; past: GameDay[] }> => {
  const { data, error } = await db()
    .from("game_days")
    .select(GAME_DAY_COLUMNS)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { referencedTable: "matches", ascending: true });
  if (error) throw new Error(`Failed to load game days: ${error.message}`);

  const today = todayInPacific();
  const all = data as unknown as GameDay[];
  return {
    upcoming: all.filter((g) => g.date >= today),
    past: all.filter((g) => g.date < today).reverse(),
  };
});

/** Map of player id → name, for rendering matchups. */
export async function getPlayerNames(): Promise<Map<string, string>> {
  return new Map((await getPlayers()).map((p) => [p.id, p.name]));
}

/** The next regular game day (Tuesday, on or after today) that doesn't have a game day yet. */
export async function nextOpenRegularDay(): Promise<string> {
  const today = todayInPacific();
  const { data, error } = await db().from("game_days").select("date").gte("date", today);
  if (error) throw new Error(`Failed to load game days: ${error.message}`);

  const taken = new Set(data.map((g) => g.date as string));
  let date = nextRegularDay(today);
  while (taken.has(date)) date = addDays(date, 7);
  return date;
}
