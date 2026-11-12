/** pair = 고정 페어 match (3 per pair), special = 스페셜 페어 match (set matchups, 1 each). */
export type TournamentMatchKind = "pair" | "special";
export type TournamentMatchStatus = "scheduled" | "in_progress" | "final";
export type TournamentWinner = "side1" | "side2" | "draw";

export const MATCH_KINDS: TournamentMatchKind[] = ["pair", "special"];
export const MATCH_STATUSES: TournamentMatchStatus[] = ["scheduled", "in_progress", "final"];

export type TournamentMatch = {
  id: string;
  kind: TournamentMatchKind;
  /** Participant ids (see fall-2026.ts). Side 1 = a + b, side 2 = a + b. */
  side1_a: string;
  side1_b: string;
  side2_a: string;
  side2_b: string;
  status: TournamentMatchStatus;
  /** HH:MM:SS Pacific wall-clock, or null if not set. */
  start_time: string | null;
  court: string | null;
  /** Only set on finished matches; null = no result entered. */
  winner: TournamentWinner | null;
  /** Games per side; both or neither. */
  score1: number | null;
  score2: number | null;
  created_at: string;
};

export type TournamentData = {
  /** False until the 0005 migration has been run: show the roster with nothing else. */
  ready: boolean;
  matches: TournamentMatch[];
  /** Ended by a moderator: results are final and members can't change them. */
  ended: boolean;
  /** False until migration 0007 has been run: the end button can't be used yet. */
  canEnd: boolean;
};

export const side1 = (m: TournamentMatch) => [m.side1_a, m.side1_b];
export const side2 = (m: TournamentMatch) => [m.side2_a, m.side2_b];
export const tournamentMatchPlayers = (m: TournamentMatch) => [...side1(m), ...side2(m)];
