export type Role = "member" | "moderator";

/** player1_win / player2_win = side 1 / side 2 won (in doubles, the whole team). */
export type MatchResult = "pending" | "player1_win" | "player2_win" | "draw";

export type GameFormat = "singles" | "doubles";

export type Player = {
  id: string;
  name: string;
};

export type CurrentPlayer = Player & { role: Role };

export type Match = {
  id: string;
  game_day_id: string;
  player1_id: string;
  player2_id: string;
  /** Doubles only: Team 1 = player1 + partner1, Team 2 = player2 + partner2. */
  partner1_id: string | null;
  partner2_id: string | null;
  court: string | null;
  note: string | null;
  result: MatchResult;
  score: string | null;
  created_at: string;
};

export type GameDay = {
  id: string;
  /** YYYY-MM-DD, Pacific calendar date */
  date: string;
  /** HH:MM:SS, Pacific wall-clock time */
  start_time: string;
  end_time: string;
  location: string;
  notes: string | null;
  format: GameFormat;
  created_at: string;
  matches: Match[];
};

/** Result of a server action, with an i18n error key on failure. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: import("./i18n").ErrorKey };

type Sides = { player1_id: string; player2_id: string; partner1_id?: string | null; partner2_id?: string | null };

/** Player ids on each side (1 for singles, 2 for doubles). */
export const team1 = (m: Sides) => (m.partner1_id ? [m.player1_id, m.partner1_id] : [m.player1_id]);
export const team2 = (m: Sides) => (m.partner2_id ? [m.player2_id, m.partner2_id] : [m.player2_id]);
/** Everyone playing in a match (2 for singles, 4 for doubles). */
export const matchPlayers = (m: Sides) => [...team1(m), ...team2(m)];
