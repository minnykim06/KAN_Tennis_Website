// 2026 Fall semester tournament (흑백전): the fixed roster.
//
// Teams and fixed pairs live here, in code, so they're reviewed with the site.
// Everything that changes during the event (matchups, times/courts, results)
// is stored in Supabase and edited by moderators on the page. 승점 is computed from results (see points.ts).
// See supabase/migrations/0005_tournament.sql.
//
// IDs are stable and never shown: team display names come from the
// translations (tournament.teamBlack/teamWhite), and a name typo can be fixed
// here without breaking stored matchups.

export type TeamId = "black" | "white";

export type Participant = {
  /** Stable id stored in the database, e.g. "B1-1". */
  id: string;
  name: string;
  teamId: TeamId;
  /** Fixed pair id, e.g. "B1". */
  pairId: string;
};

export type Pair = {
  id: string;
  teamId: TeamId;
  members: [Participant, Participant];
};

export type Team = {
  id: TeamId;
  pairs: Pair[];
};

export const TOURNAMENT_ID = "fall-2026";
export const TOURNAMENT_PATH = "/tournament/fall-2026";

/** Each fixed pair plays this many pair matches; all pairs together play PLANNED_PAIR_MATCHES. */
export const PAIR_MATCHES_PER_PAIR = 3;

const ROSTER: Record<TeamId, [string, string][]> = {
  black: [
    ["William Pechkis", "주현우"],
    ["Aidan Jang", "이재선"],
    ["손준영", "이동진"],
    ["이지윤", "이민준"],
    ["정재용", "장유진"],
  ],
  white: [
    ["김민성", "이단비"],
    ["박승비", "김주현"],
    ["Victor Kim", "김호준"],
    ["한지훈", "홍우진"],
    ["김민서", "이하민"],
  ],
};

export const TEAM_IDS: TeamId[] = ["black", "white"];

export const TEAMS: Team[] = TEAM_IDS.map((teamId) => ({
  id: teamId,
  pairs: ROSTER[teamId].map(([a, b], i) => {
    const pairId = `${teamId === "black" ? "B" : "W"}${i + 1}`;
    const member = (name: string, n: number): Participant => ({ id: `${pairId}-${n}`, name, teamId, pairId });
    return { id: pairId, teamId, members: [member(a, 1), member(b, 2)] };
  }),
}));

export const PAIRS: Pair[] = TEAMS.flatMap((t) => t.pairs);
export const PARTICIPANTS: Participant[] = PAIRS.flatMap((p) => p.members);

/** Every pair plays PAIR_MATCHES_PER_PAIR matches, two pairs per match → 15. */
export const PLANNED_PAIR_MATCHES = (PAIRS.length * PAIR_MATCHES_PER_PAIR) / 2;

const participantById = new Map(PARTICIPANTS.map((p) => [p.id, p]));
const pairById = new Map(PAIRS.map((p) => [p.id, p]));

export const getParticipant = (id: string) => participantById.get(id);
export const getPair = (id: string) => pairById.get(id);
export const isParticipantId = (id: string) => participantById.has(id);

// --- 스페셜 페어 -------------------------------------------------------------
// Set matchups: one 흑팀 special pair vs one 백팀 special pair, 1 match each.
// Seeded as matches by supabase/migrations/0006_special_pairs.sql, replaced by
// 0009_new_roster.sql (same ids).

export type SpecialMatchup = {
  id: string;
  /** 흑팀 pair, then 백팀 pair (participant ids). */
  black: [string, string];
  white: [string, string];
};

export const SPECIAL_MATCHUPS: SpecialMatchup[] = [
  { id: "S1", black: ["B1-1", "B3-1"], white: ["W1-1", "W5-1"] }, // William Pechkis / 손준영 vs 김민성 / 김민서
  { id: "S2", black: ["B2-1", "B4-1"], white: ["W2-1", "W3-1"] }, // Aidan Jang / 이지윤 vs 박승비 / Victor Kim
  { id: "S3", black: ["B5-2", "B3-2"], white: ["W2-2", "W1-2"] }, // 장유진 / 이동진 vs 김주현 / 이단비
  { id: "S4", black: ["B5-1", "B2-2"], white: ["W4-1", "W3-2"] }, // 정재용 / 이재선 vs 한지훈 / 김호준
  { id: "S5", black: ["B4-2", "B1-2"], white: ["W4-2", "W5-2"] }, // 이민준 / 주현우 vs 홍우진 / 이하민
];

export const SPECIAL_MATCHES = SPECIAL_MATCHUPS.length;

const SPECIAL_PAIRS: [string, string][] = SPECIAL_MATCHUPS.flatMap((m) => [m.black, m.white]);

/** True when the two players form a fixed pair (kind "pair") or a special pair (kind "special"). */
export function isPairOf(kind: "pair" | "special", a: string, b: string): boolean {
  if (kind === "pair") {
    const pa = getParticipant(a)?.pairId;
    return !!pa && pa === getParticipant(b)?.pairId && a !== b;
  }
  return SPECIAL_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** The player's partner for that match type. */
export function partnerFor(kind: "pair" | "special", id: string): string | undefined {
  if (kind === "pair") return PARTICIPANTS.find((p) => p.id !== id && p.pairId === getParticipant(id)?.pairId)?.id;
  const pair = SPECIAL_PAIRS.find((p) => p.includes(id));
  return pair?.find((x) => x !== id);
}

// --- 고정 페어 schedule (제비뽑기) --------------------------------------------
// Each team's pairs draw letters A–E on the day; the 15 matches follow this
// letter schedule (흑팀 letter vs 백팀 letter), three rounds of five.

export const LETTERS = ["A", "B", "C", "D", "E"] as const;
export type Letter = (typeof LETTERS)[number];

export const PAIR_SCHEDULE: [Letter, Letter][] = [
  ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"],
  ["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"], ["E", "A"],
  ["A", "C"], ["B", "D"], ["C", "E"], ["D", "A"], ["E", "B"],
];

/** Letter → pair id for each team, as drawn on the day. */
export type PairDraw = Record<TeamId, Record<Letter, string>>;

/** Each pair plays exactly PAIR_MATCHES_PER_PAIR times in the schedule. */
export function isValidDraw(draw: unknown): draw is PairDraw {
  if (!draw || typeof draw !== "object") return false;
  return TEAMS.every((team) => {
    const byLetter = (draw as Record<string, Record<string, string>>)[team.id];
    if (!byLetter) return false;
    const ids = LETTERS.map((l) => byLetter[l]);
    const teamPairs = new Set(team.pairs.map((p) => p.id));
    return ids.every((id) => teamPairs.has(id)) && new Set(ids).size === LETTERS.length;
  });
}

/** The pair id's letter in the draw, if drawn. */
export function letterOf(draw: PairDraw | null, pairId: string): Letter | undefined {
  const teamId = getPair(pairId)?.teamId;
  if (!draw || !teamId) return undefined;
  return LETTERS.find((l) => draw[teamId][l] === pairId);
}

// --- Times and courts (11/20 schedule) ---------------------------------------
// Start time ("HH:MM") and court of each scheduled match, by match number:
// 1–15 are the 고정 페어 slots (applied when the draw creates them), 16–20 the
// 스페셜 페어 matchups in SPECIAL_MATCHUPS order.

export type MatchPlace = { start_time: string; court: string };

const place = (start_time: string, court: number): MatchPlace => ({ start_time, court: `뮤어 ${court}` });

export const MATCH_PLACES: MatchPlace[] = [
  place("17:30", 1), place("17:30", 2), place("17:30", 3),
  place("18:00", 1), place("18:00", 2), place("18:00", 3), place("18:00", 4),
  place("18:30", 1), place("18:30", 2), place("18:30", 3), place("18:30", 4),
  place("19:00", 1), place("19:00", 2), place("19:00", 3), place("19:00", 4),
  place("19:30", 1), place("19:30", 2), place("19:30", 3), place("19:30", 4),
  place("20:00", 2),
];
