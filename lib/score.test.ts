import { describe, expect, it } from "vitest";
import { gamesFromScore, parseScore } from "./score";

describe("parseScore", () => {
  it("parses comma-separated sets", () => {
    expect(parseScore("6-4, 3-6, 10-8")).toEqual([
      [6, 4],
      [3, 6],
      [10, 8],
    ]);
  });

  it("accepts single sets, spaces, en dashes, colons and tiebreak details", () => {
    expect(parseScore("8-5")).toEqual([[8, 5]]);
    expect(parseScore("6 - 4 , 7–6(5)")).toEqual([
      [6, 4],
      [7, 6],
    ]);
    expect(parseScore("6:4 6:2")).toEqual([
      [6, 4],
      [6, 2],
    ]);
  });

  it("rejects things that aren't scores", () => {
    expect(parseScore("")).toBeNull();
    expect(parseScore("won easily")).toBeNull();
    expect(parseScore("6-4, abc")).toBeNull();
    expect(parseScore("6")).toBeNull();
    expect(parseScore("100-2")).toBeNull();
  });
});

describe("gamesFromScore", () => {
  it("adds up games from side 1's point of view", () => {
    expect(gamesFromScore("6-4, 3-6")).toEqual({ side1: 9, side2: 10 });
  });

  it("counts every game, including scores of 10 or more", () => {
    expect(gamesFromScore("10-8")).toEqual({ side1: 10, side2: 8 });
  });

  it("returns null for missing or invalid scores", () => {
    expect(gamesFromScore(null)).toBeNull();
    expect(gamesFromScore("")).toBeNull();
    expect(gamesFromScore("ret.")).toBeNull();
  });
});
