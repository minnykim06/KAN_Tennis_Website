import { describe, expect, it } from "vitest";
import { PARTICIPANTS, PLANNED_PAIR_MATCHES, SPECIAL_MATCHUPS, TEAMS, isPairOf, partnerFor } from "./fall-2026";
import { computeTeamPoints, rankPlayersByTeam } from "./points";
import type { TournamentMatch } from "./types";

describe("fall 2026 roster", () => {
  it("has 20 players, 10 per team, 5 pairs per team", () => {
    expect(PARTICIPANTS).toHaveLength(20);
    expect(new Set(PARTICIPANTS.map((p) => p.name)).size).toBe(20);
    for (const team of TEAMS) {
      expect(team.pairs).toHaveLength(5);
      expect(PARTICIPANTS.filter((p) => p.teamId === team.id)).toHaveLength(10);
    }
    expect(PLANNED_PAIR_MATCHES).toBe(15);
  });

  it("keeps the announced fixed pairs", () => {
    const pairs = TEAMS.map((team) => team.pairs.map((p) => p.members.map((x) => x.name).join(" / ")));
    expect(pairs).toEqual([
      ["Aidan Jang / 이재선", "이지윤 / 이민준", "정재용 / 한지훈", "William Pechkis / 주현우", "Victor Kim / 장유진"],
      ["김민성 / 이단비", "김주현 / 도정현", "김민서 / 김호준", "손준영 / 이동진", "박승비 / 홍우진"],
    ]);
  });
});

describe("special pairs", () => {
  it("are the five set matchups, 흑팀 vs 백팀, everyone once", () => {
    const name = (id: string) => PARTICIPANTS.find((p) => p.id === id)!.name;
    expect(SPECIAL_MATCHUPS.map((m) => `${m.black.map(name).join(" / ")} vs ${m.white.map(name).join(" / ")}`)).toEqual([
      "William Pechkis / Victor Kim vs 김민성 / 김민서",
      "Aidan Jang / 이지윤 vs 박승비 / 손준영",
      "장유진 / 주현우 vs 김주현 / 이단비",
      "정재용 / 이재선 vs 도정현 / 홍우진",
      "한지훈 / 이민준 vs 이동진 / 김호준",
    ]);
    const all = SPECIAL_MATCHUPS.flatMap((m) => [...m.black, ...m.white]);
    expect(new Set(all).size).toBe(20);
    expect(SPECIAL_MATCHUPS.every((m) => m.black.every((id) => id.startsWith("B")) && m.white.every((id) => id.startsWith("W")))).toBe(true);
  });

  it("knows partners per match type", () => {
    expect(partnerFor("pair", "B4-1")).toBe("B4-2");
    expect(partnerFor("special", "B4-1")).toBe("B5-1");
    expect(isPairOf("special", "W3-1", "W1-1")).toBe(true);
    expect(isPairOf("special", "B4-1", "B4-2")).toBe(false);
    expect(isPairOf("pair", "B4-1", "B4-2")).toBe(true);
  });
});

describe("points", () => {
  const d = (
    kind: TournamentMatch["kind"],
    status: TournamentMatch["status"],
    winner: TournamentMatch["winner"],
    ids: [string, string, string, string],
    score: [number, number] | null = null,
  ) => ({
    kind,
    status,
    winner,
    score1: score?.[0] ?? null,
    score2: score?.[1] ?? null,
    side1_a: ids[0],
    side1_b: ids[1],
    side2_a: ids[2],
    side2_b: ids[3],
  });

  it("gives 3 for a win and 1 for a loss, from both match types", () => {
    const matches = [
      d("pair", "final", "side1", ["B1-1", "B1-2", "W1-1", "W1-2"]),
      d("special", "final", "side2", ["B1-1", "B2-1", "W5-1", "W4-1"]),
    ];
    expect(computeTeamPoints(matches)).toEqual({ black: 4, white: 4 });
    const r = rankPlayersByTeam(matches);
    const black = Object.fromEntries(r.black.map((p) => [p.id, p]));
    expect(black["B1-1"]).toMatchObject({ points: 4, played: 2, rank: 1 });
    expect(black["B1-2"]).toMatchObject({ points: 3, played: 1, rank: 2 });
    expect(black["B2-1"]).toMatchObject({ points: 1, played: 1, rank: 3 });
    expect(black["B3-1"]).toMatchObject({ points: 0, played: 0, rank: 4 });
    expect(r.white[0]).toMatchObject({ points: 3 });
  });

  it("ignores scheduled, in-progress and result-less matches", () => {
    const matches = [
      d("pair", "scheduled", null, ["B1-1", "B1-2", "W1-1", "W1-2"]),
      d("pair", "in_progress", null, ["B1-1", "B1-2", "W1-1", "W1-2"]),
      d("special", "final", null, ["B1-1", "B2-1", "W5-1", "W4-1"]),
    ];
    expect(computeTeamPoints(matches)).toEqual({ black: 0, white: 0 });
    expect(rankPlayersByTeam(matches).black.every((p) => p.points === 0 && p.rank === 1)).toBe(true);
  });

  it("breaks ties on points by game difference (4–0 beats 4–1)", () => {
    const r = rankPlayersByTeam([
      d("pair", "final", "side1", ["B1-1", "B1-2", "W1-1", "W1-2"], [4, 1]),
      d("pair", "final", "side1", ["B2-1", "B2-2", "W2-1", "W2-2"], [4, 0]),
    ]);
    const black = Object.fromEntries(r.black.map((p) => [p.id, p]));
    expect(black["B2-1"]).toMatchObject({ points: 3, gameDiff: 4, rank: 1 });
    expect(black["B2-2"]).toMatchObject({ rank: 1 });
    expect(black["B1-1"]).toMatchObject({ points: 3, gameDiff: 3, rank: 3 });
    expect(r.black[0].id).toBe("B2-1");
    const white = Object.fromEntries(r.white.map((p) => [p.id, p]));
    expect(white["W1-1"]).toMatchObject({ points: 1, gameDiff: -3, rank: 1 });
    expect(white["W2-1"]).toMatchObject({ points: 1, gameDiff: -4, rank: 3 });
  });
});
