import { TEAMS, getParticipant, type TeamId } from "./fall-2026";
import type { TournamentMatch } from "./types";

/** 승점 per side, per finished match with a result. */
export const POINTS_PER_RESULT = { win: 3, loss: 1, draw: 2 } as const;

type Counted = Pick<TournamentMatch, "status" | "winner" | "side1_a" | "side1_b" | "side2_a" | "side2_b" | "score1" | "score2">;

/**
 * Points each side of each scored match earned. Only finished matches with a
 * result count; scheduled, in-progress and result-less matches add nothing.
 * Both match types (고정 페어 and 스페셜 페어) count.
 */
function scoredSides(matches: Counted[]): { ids: string[]; points: number; gameDiff: number }[] {
  return matches.flatMap((m) => {
    if (m.status !== "final" || !m.winner) return [];
    const at = (side: "side1" | "side2") =>
      m.winner === "draw" ? POINTS_PER_RESULT.draw : m.winner === side ? POINTS_PER_RESULT.win : POINTS_PER_RESULT.loss;
    // Games won − games lost; a match without a score adds nothing.
    const diff = m.score1 !== null && m.score2 !== null ? m.score1 - m.score2 : 0;
    return [
      { ids: [m.side1_a, m.side1_b], points: at("side1"), gameDiff: diff },
      { ids: [m.side2_a, m.side2_b], points: at("side2"), gameDiff: -diff },
    ];
  });
}

/** Team total: each match adds its side's points once to that side's team. */
export function computeTeamPoints(matches: Counted[]): Record<TeamId, number> {
  const total: Record<TeamId, number> = { black: 0, white: 0 };
  for (const side of scoredSides(matches)) {
    const team = getParticipant(side.ids[0])?.teamId;
    if (team) total[team] += side.points;
  }
  return total;
}

export type RankedPlayer = {
  id: string;
  name: string;
  /** Fixed partner. */
  partner: string;
  points: number;
  /** Games won − games lost over their scored matches: breaks ties on points. */
  gameDiff: number;
  played: number;
  /** Shared by players tied on both points and game difference (1, 1, 3, …). */
  rank: number;
};

/**
 * Each player's own 승점, ranked within their team: points, then game
 * difference (4–0 beats 4–1). Players tied on both share a rank, in roster order.
 */
export function rankPlayersByTeam(matches: Counted[]): Record<TeamId, RankedPlayer[]> {
  const tally = new Map<string, { points: number; gameDiff: number; played: number }>();
  for (const side of scoredSides(matches)) {
    for (const id of side.ids) {
      const t = tally.get(id) ?? { points: 0, gameDiff: 0, played: 0 };
      t.points += side.points;
      t.gameDiff += side.gameDiff;
      t.played += 1;
      tally.set(id, t);
    }
  }

  const result = {} as Record<TeamId, RankedPlayer[]>;
  for (const team of TEAMS) {
    const players = team.pairs.flatMap((pair) =>
      pair.members.map((p, j) => ({
        id: p.id,
        name: p.name,
        partner: pair.members[1 - j].name,
        ...(tally.get(p.id) ?? { points: 0, gameDiff: 0, played: 0 }),
      })),
    );
    // Stable sort: roster order among full ties.
    const sorted = [...players].sort((a, b) => b.points - a.points || b.gameDiff - a.gameDiff);
    result[team.id] = sorted.map((p) => ({
      ...p,
      rank: sorted.findIndex((q) => q.points === p.points && q.gameDiff === p.gameDiff) + 1,
    }));
  }
  return result;
}
