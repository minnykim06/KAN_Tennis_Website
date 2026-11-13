import { describe, expect, it } from "vitest";
import { LETTERS, PAIR_MATCHES_PER_PAIR, PAIR_SCHEDULE, PLANNED_PAIR_MATCHES, isValidDraw } from "./fall-2026";

describe("고정 페어 schedule", () => {
  it("has 15 matches, each letter playing 3 times per team, never the same matchup twice", () => {
    expect(PAIR_SCHEDULE).toHaveLength(PLANNED_PAIR_MATCHES);
    for (const l of LETTERS) {
      expect(PAIR_SCHEDULE.filter(([b]) => b === l)).toHaveLength(PAIR_MATCHES_PER_PAIR);
      expect(PAIR_SCHEDULE.filter(([, w]) => w === l)).toHaveLength(PAIR_MATCHES_PER_PAIR);
    }
    expect(new Set(PAIR_SCHEDULE.map(([b, w]) => b + w)).size).toBe(15);
  });

  it("follows the announced order", () => {
    expect(PAIR_SCHEDULE.map(([b, w]) => `흑${b} vs 백${w}`).slice(9, 11)).toEqual(["흑E vs 백A", "흑A vs 백C"]);
  });

  it("accepts only a full, one-to-one draw per team", () => {
    const ok = {
      black: { A: "B3", B: "B1", C: "B5", D: "B2", E: "B4" },
      white: { A: "W2", B: "W4", C: "W1", D: "W5", E: "W3" },
    };
    expect(isValidDraw(ok)).toBe(true);
    expect(isValidDraw({ ...ok, black: { ...ok.black, E: "B3" } })).toBe(false); // B3 twice
    expect(isValidDraw({ ...ok, white: { ...ok.white, A: "B1" } })).toBe(false); // wrong team
    expect(isValidDraw({ black: ok.black })).toBe(false);
  });
});
