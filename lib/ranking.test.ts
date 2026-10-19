import { describe, expect, it } from "vitest";
import { computeRankings, type RankingMatch } from "./ranking";
import type { MatchResult, Player } from "./types";

const players = (...names: string[]): Player[] => names.map((name) => ({ id: name, name }));
const m = (player1_id: string, player2_id: string, result: MatchResult, score?: string): RankingMatch => ({
  player1_id,
  player2_id,
  result,
  score,
});
const byName = (standings: ReturnType<typeof computeRankings>) =>
  Object.fromEntries(standings.map((s) => [s.name, s]));

describe("computeRankings", () => {
  describe("points", () => {
    it("awards 5 for a win, 3 for a draw, 1 for a loss", () => {
      const s = byName(
        computeRankings(players("A", "B", "C"), [
          m("A", "B", "player1_win"),
          m("B", "C", "draw"),
          m("C", "A", "player2_win"),
        ]),
      );
      expect(s.A).toMatchObject({ played: 2, wins: 2, draws: 0, losses: 0, points: 10 });
      expect(s.B).toMatchObject({ played: 2, wins: 0, draws: 1, losses: 1, points: 4 });
      expect(s.C).toMatchObject({ played: 2, wins: 0, draws: 1, losses: 1, points: 4 });
    });

    it("rewards playing: a loss still beats not playing", () => {
      const s = byName(computeRankings(players("A", "B", "C"), [m("A", "B", "player1_win"), m("A", "B", "player1_win")]));
      expect(s.B).toMatchObject({ losses: 2, points: 2, rank: 2 });
      expect(s.C).toMatchObject({ played: 0, points: 0, rank: null });
    });

    it("credits player2 wins to player2", () => {
      const s = byName(computeRankings(players("A", "B"), [m("A", "B", "player2_win")]));
      expect(s.B.points).toBe(5);
      expect(s.A.points).toBe(1);
    });

    it("ignores pending matches", () => {
      const s = byName(computeRankings(players("A", "B"), [m("A", "B", "pending")]));
      expect(s.A.played).toBe(0);
      expect(s.B.played).toBe(0);
    });

    it("ignores matches with unknown players", () => {
      const s = byName(computeRankings(players("A"), [m("A", "ghost", "player1_win")]));
      expect(s.A.played).toBe(0);
    });
  });

  describe("game difference", () => {
    it("adds up games won and lost from scores, from each side's point of view", () => {
      const s = byName(
        computeRankings(players("A", "B", "C"), [
          m("A", "B", "player1_win", "6-4, 6-3"), // A +5
          m("C", "A", "player1_win", "6-2"), // A −4, C +4
        ]),
      );
      expect(s.A).toMatchObject({ gamesWon: 14, gamesLost: 13, gameDiff: 1 });
      expect(s.B).toMatchObject({ gamesWon: 7, gamesLost: 12, gameDiff: -5 });
      expect(s.C).toMatchObject({ gamesWon: 6, gamesLost: 2, gameDiff: 4 });
    });

    it("matches the club example: won 6-0, lost 4-6 → +4", () => {
      const s = byName(
        computeRankings(players("A", "B", "C"), [
          m("A", "B", "player1_win", "6-0"),
          m("A", "C", "player2_win", "4-6"),
        ]),
      );
      expect(s.A).toMatchObject({ gamesWon: 10, gamesLost: 6, gameDiff: 4 });
    });

    it("ranks a higher game diff above a lower one on equal points", () => {
      const s = computeRankings(players("A", "B", "C", "D"), [
        m("A", "C", "player1_win", "6-4"),
        m("B", "D", "player1_win", "6-0"),
      ]);
      expect(s.map((x) => x.name).slice(0, 2)).toEqual(["B", "A"]);
      expect(s[0].rank).toBe(1);
      expect(s[1].rank).toBe(2);
    });

    it("includes draws", () => {
      const s = byName(computeRankings(players("A", "B"), [m("A", "B", "draw", "6-6")]));
      expect(s.A).toMatchObject({ gamesWon: 6, gamesLost: 6, gameDiff: 0 });
    });

    it("adds nothing for matches without a valid score, but still counts the result", () => {
      const s = byName(
        computeRankings(players("A", "B"), [m("A", "B", "player1_win"), m("A", "B", "player1_win", "retired")]),
      );
      expect(s.A).toMatchObject({ wins: 2, points: 10, gamesWon: 0, gamesLost: 0, gameDiff: 0 });
    });
  });

  describe("sorting and tie-breaking", () => {
    it("sorts by points first", () => {
      const r = computeRankings(players("A", "B"), [m("A", "B", "player2_win")]);
      expect(r.map((s) => s.name)).toEqual(["B", "A"]);
    });

    it("breaks equal points by game difference", () => {
      // All on 5 pts with 1 win.  B won 6-0 (+6), C won 6-4 (+2), A won 7-6 (+1).
      const r = computeRankings(players("A", "B", "C", "X"), [
        m("A", "X", "player1_win", "7-6"),
        m("B", "X", "player1_win", "6-0"),
        m("C", "X", "player1_win", "6-4"),
      ]);
      const top = r.filter((s) => s.name !== "X");
      expect(top.map((s) => [s.name, s.points, s.gameDiff, s.rank])).toEqual([
        ["B", 5, 6, 1],
        ["C", 5, 2, 2],
        ["A", 5, 1, 3],
      ]);
    });

    it("puts game difference ahead of W–L record", () => {
      // Same points (6). A: 1W 1L but +5 games.  B: 2 draws, 0 games.
      const r = computeRankings(players("A", "B", "X"), [
        m("A", "X", "player1_win", "6-0"),
        m("A", "X", "player2_win", "5-6"),
        m("B", "X", "draw"),
        m("B", "X", "draw"),
      ]);
      expect(r.filter((s) => s.name !== "X").map((s) => s.name)).toEqual(["A", "B"]);
    });

    it("breaks equal points and game difference by wins", () => {
      // No scores, so game diff is 0 for both.  A: 1W 1L = 6 pts.  B: 2D = 6 pts.  → A (more wins) first
      const r = computeRankings(players("A", "B", "X"), [
        m("A", "X", "player1_win"),
        m("A", "X", "player2_win"),
        m("B", "X", "draw"),
        m("B", "X", "draw"),
      ]);
      const a = r.findIndex((s) => s.name === "A");
      const b = r.findIndex((s) => s.name === "B");
      expect(a).toBeLessThan(b);
      expect(r[a].rank).not.toBe(r[b].rank);
    });

    it("breaks full ties alphabetically by name (case-insensitive)", () => {
      const r = computeRankings(players("charlie", "Bravo", "alpha", "Z"), [
        m("charlie", "Z", "player1_win"),
        m("Bravo", "Z", "player1_win"),
        m("alpha", "Z", "player1_win"),
      ]);
      expect(r.map((s) => s.name)).toEqual(["alpha", "Bravo", "charlie", "Z"]);
    });
  });

  describe("shared ranks", () => {
    it("gives tied players the same rank and skips the next rank (1, 1, 3)", () => {
      const r = computeRankings(players("A", "B", "C", "D"), [
        m("A", "D", "player1_win", "6-3"),
        m("B", "D", "player1_win", "6-3"),
        m("C", "D", "draw", "6-6"),
      ]);
      // D played three times (2L 1D = 5 pts), so D outscores C (1D = 3 pts).
      expect(r.map((s) => [s.name, s.rank])).toEqual([
        ["A", 1],
        ["B", 1],
        ["D", 3],
        ["C", 4],
      ]);
    });

    it("does not share a rank when only points are equal", () => {
      // Same points and game diff (no scores). A: 1W 1L, B: 2D → A has more wins
      const r = computeRankings(players("A", "B", "X"), [
        m("A", "X", "player1_win"),
        m("A", "X", "player2_win"),
        m("B", "X", "draw"),
        m("B", "X", "draw"),
      ]);
      // X played four times and leads; A and B are level on 6 pts.
      const s = byName(r);
      expect(s.A.rank).toBe(2);
      expect(s.B.rank).toBe(3);
    });
  });

  describe("doubles", () => {
    const d = (a: string, b: string, c: string, e: string, result: MatchResult): RankingMatch => ({
      player1_id: a,
      partner1_id: b,
      player2_id: c,
      partner2_id: e,
      result,
    });

    it("gives both winners a win and both losers a loss", () => {
      const s = byName(
        computeRankings(players("A", "B", "C", "D"), [{ ...d("A", "B", "C", "D", "player2_win"), score: "3-6" }]),
      );
      expect(s.C).toMatchObject({ played: 1, wins: 1, points: 5, gamesWon: 6, gamesLost: 3, gameDiff: 3 });
      expect(s.D).toMatchObject({ played: 1, wins: 1, points: 5, gameDiff: 3 });
      expect(s.A).toMatchObject({ played: 1, losses: 1, points: 1, gamesWon: 3, gamesLost: 6, gameDiff: -3 });
      expect(s.B).toMatchObject({ played: 1, losses: 1, points: 1, gameDiff: -3 });
    });

    it("gives all four players a draw", () => {
      const r = computeRankings(players("A", "B", "C", "D"), [d("A", "B", "C", "D", "draw")]);
      expect(r.every((s) => s.draws === 1 && s.points === 3)).toBe(true);
      expect(r.every((s) => s.rank === 1)).toBe(true);
    });

    it("combines singles and doubles into one table", () => {
      const s = byName(
        computeRankings(players("A", "B", "C", "D"), [d("A", "B", "C", "D", "player1_win"), m("A", "C", "player1_win")]),
      );
      expect(s.A).toMatchObject({ played: 2, wins: 2, points: 10 });
      expect(s.C).toMatchObject({ played: 2, losses: 2 });
    });

    it("ignores a doubles match that lists someone twice", () => {
      const r = computeRankings(players("A", "B", "C"), [d("A", "B", "C", "A", "player1_win")]);
      expect(r.every((s) => s.played === 0)).toBe(true);
    });
  });

  describe("players with no matches", () => {
    it("still appear, at the bottom, unranked", () => {
      const r = computeRankings(players("Aaron", "B", "C"), [m("B", "C", "player2_win")]);
      expect(r.map((s) => s.name)).toEqual(["C", "B", "Aaron"]);
      expect(r[2]).toMatchObject({ played: 0, points: 0, gameDiff: 0, rank: null });
    });

    it("sit below players with negative game difference and only loss points", () => {
      const r = computeRankings(players("Loser", "Idle", "Winner"), [m("Winner", "Loser", "player1_win", "6-0")]);
      expect(r.map((s) => s.name)).toEqual(["Winner", "Loser", "Idle"]);
      expect(byName(r).Loser.rank).toBe(2);
    });

    it("are all listed when nobody has played", () => {
      const r = computeRankings(players("B", "A"), []);
      expect(r.map((s) => s.name)).toEqual(["A", "B"]);
      expect(r.every((s) => s.rank === null)).toBe(true);
    });

    it("handles an empty club", () => {
      expect(computeRankings([], [])).toEqual([]);
    });
  });
});
