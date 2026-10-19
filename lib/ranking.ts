import { gamesFromScore } from "./score";
import { team1, team2, type MatchResult, type Player } from "./types";

export type RankingMatch = {
  player1_id: string;
  player2_id: string;
  partner1_id?: string | null;
  partner2_id?: string | null;
  result: MatchResult;
  /** Written from side 1's point of view, e.g. "6-4, 3-6, 10-8". */
  score?: string | null;
};

export type Standing = {
  playerId: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  /** Games won − games lost, from match scores. */
  gameDiff: number;
  points: number;
  /** Shared by players tied on points, game diff and wins. null = no matches played yet. */
  rank: number | null;
};

export const POINTS = { win: 5, draw: 3, loss: 1 } as const;

// Fixed locale so ordering is deterministic on every server.
const collator = new Intl.Collator("en", { sensitivity: "base" });

function compare(a: Standing, b: Standing): number {
  // Players who haven't played sit below everyone who has.
  if ((a.played === 0) !== (b.played === 0)) return a.played === 0 ? 1 : -1;
  return (
    b.points - a.points ||
    b.gameDiff - a.gameDiff ||
    b.wins - a.wins ||
    collator.compare(a.name, b.name)
  );
}

const tied = (a: Standing, b: Standing) =>
  a.points === b.points && a.gameDiff === b.gameDiff && a.wins === b.wins;

/**
 * Compute standings from match results. Pending matches and matches involving
 * unknown players are ignored. Every player appears, including those with no
 * completed matches (at the bottom, unranked).
 *
 * Doubles count individually: each partner on the winning team gets a win,
 * each player on the losing team gets a loss, and a draw is a draw for all four.
 * Partners also share their team's games. Matches without a (valid) score add
 * nothing to game difference.
 */
export function computeRankings(players: Player[], matches: RankingMatch[]): Standing[] {
  const table = new Map<string, Standing>(
    players.map((p) => [
      p.id,
      {
        playerId: p.id,
        name: p.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDiff: 0,
        points: 0,
        rank: null,
      },
    ]),
  );

  for (const m of matches) {
    if (m.result === "pending") continue;
    const side1 = team1(m).map((id) => table.get(id));
    const side2 = team2(m).map((id) => table.get(id));
    const everyone = [...side1, ...side2];
    // Skip malformed matches: unknown players or someone listed twice.
    if (everyone.some((s) => !s) || new Set(everyone).size !== everyone.length) continue;
    const [s1, s2] = [side1 as Standing[], side2 as Standing[]];

    for (const s of [...s1, ...s2]) s.played++;
    if (m.result === "draw") {
      for (const s of [...s1, ...s2]) s.draws++;
    } else {
      const [winners, losers] = m.result === "player1_win" ? [s1, s2] : [s2, s1];
      for (const s of winners) s.wins++;
      for (const s of losers) s.losses++;
    }

    const games = gamesFromScore(m.score);
    if (games) {
      for (const s of s1) {
        s.gamesWon += games.side1;
        s.gamesLost += games.side2;
      }
      for (const s of s2) {
        s.gamesWon += games.side2;
        s.gamesLost += games.side1;
      }
    }
  }

  const standings = [...table.values()];
  for (const s of standings) {
    s.gameDiff = s.gamesWon - s.gamesLost;
    s.points = s.wins * POINTS.win + s.draws * POINTS.draw + s.losses * POINTS.loss;
  }
  standings.sort(compare);

  // Standard competition ranking: 1, 2, 2, 4 …
  standings.forEach((s, i) => {
    if (s.played === 0) return;
    const prev = standings[i - 1];
    s.rank = prev && prev.played > 0 && tied(prev, s) ? prev.rank : i + 1;
  });

  return standings;
}
