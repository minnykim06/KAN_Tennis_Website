// Score strings are written from side 1's point of view (player 1 / Team 1):
// "6-0" → side 1 won 6 games, side 2 won 0. Older entries may list several sets: "6-4, 3-6".

export type SetScore = [side1: number, side2: number];

// "6-4", "7-6(5)", "6–4", "6:4"
const SET = /^(\d{1,2})\s*[-–—:]\s*(\d{1,2})(?:\s*\(\d{1,2}\))?$/;

/** Parse "6-4, 3-6, 10-8" into sets. Returns null if it isn't a valid score. */
export function parseScore(score: string): SetScore[] | null {
  const parts = score
    .split(/[,;/]|\s{2,}|\s(?=\d+\s*[-–—:])/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 5) return null;

  const sets: SetScore[] = [];
  for (const part of parts) {
    const m = SET.exec(part);
    if (!m) return null;
    sets.push([Number(m[1]), Number(m[2])]);
  }
  return sets;
}

/** Total games won by each side across all sets. Returns null for missing or unparseable scores. */
export function gamesFromScore(score: string | null | undefined): { side1: number; side2: number } | null {
  if (!score) return null;
  const sets = parseScore(score);
  if (!sets) return null;
  return {
    side1: sets.reduce((sum, [a]) => sum + a, 0),
    side2: sets.reduce((sum, [, b]) => sum + b, 0),
  };
}
