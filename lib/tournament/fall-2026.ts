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
    ["Aidan Jang", "이재선"],
    ["이지윤", "이민준"],
    ["정재용", "한지훈"],
    ["William Pechkis", "주현우"],
    ["Victor Kim", "장유진"],
  ],
  white: [
    ["김민성", "이단비"],
    ["김주현", "도정현"],
    ["김민서", "김호준"],
    ["손준영", "이동진"],
    ["박승비", "홍우진"],
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
// Seeded as matches by supabase/migrations/0006_special_pairs.sql (same ids).

export type SpecialMatchup = {
  id: string;
  /** 흑팀 pair, then 백팀 pair (participant ids). */
  black: [string, string];
  white: [string, string];
};

export const SPECIAL_MATCHUPS: SpecialMatchup[] = [
  { id: "S1", black: ["B4-1", "B5-1"], white: ["W1-1", "W3-1"] }, // William Pechkis / Victor Kim vs 김민성 / 김민서
  { id: "S2", black: ["B1-1", "B2-1"], white: ["W5-1", "W4-1"] }, // Aidan Jang / 이지윤 vs 박승비 / 손준영
  { id: "S3", black: ["B5-2", "B4-2"], white: ["W2-1", "W1-2"] }, // 장유진 / 주현우 vs 김주현 / 이단비
  { id: "S4", black: ["B3-1", "B1-2"], white: ["W2-2", "W5-2"] }, // 정재용 / 이재선 vs 도정현 / 홍우진
  { id: "S5", black: ["B3-2", "B2-2"], white: ["W4-2", "W3-2"] }, // 한지훈 / 이민준 vs 이동진 / 김호준
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
