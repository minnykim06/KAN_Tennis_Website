"use client";

import { useState } from "react";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { SPECIAL_MATCHUPS, TEAMS, getParticipant, type TeamId } from "@/lib/tournament/fall-2026";
import type { RankedPlayer } from "@/lib/tournament/points";
import { MATCH_KINDS, side1, side2, type TournamentMatch } from "@/lib/tournament/types";

// Fixed colors, independent of light/night mode: 흑팀 is always the dark card,
// 백팀 always the light one. Both keep a visible border on either page color.
export const TEAM_CARD: Record<TeamId, { card: string; sub: string; row: string; num: string }> = {
  black: {
    card: "border-neutral-600 bg-neutral-950 text-white",
    sub: "text-neutral-300",
    row: "border-neutral-800",
    num: "border-neutral-600 text-neutral-300",
  },
  white: {
    card: "border-neutral-400 bg-white text-neutral-950",
    sub: "text-neutral-600",
    row: "border-neutral-200",
    num: "border-neutral-400 text-neutral-600",
  },
};

type Tab = "pairs" | "special" | "rankings";

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/** 팀·페어: 고정 페어 (partners only), 스페셜 페어 (the set matchups) and 개인 순위 (points within each team). */
export function TeamSection({
  teamNames,
  rankings,
  teamPoints,
  matches,
}: {
  teamNames: Record<TeamId, string>;
  /** All tournament matches, for each player's drop-down in 개인 순위. */
  matches: TournamentMatch[];
  rankings: Record<TeamId, RankedPlayer[]>;
  /** Team total: the sum of its pairs' 승점 from fixed-pair matches. */
  teamPoints: Record<TeamId, number>;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("pairs");
  const [openId, setOpenId] = useState<string | null>(null);
  const tabs: { id: Tab; label: string }[] = [
    { id: "pairs", label: t.tournament.tabPairs },
    { id: "special", label: t.tournament.tabSpecial },
    { id: "rankings", label: t.tournament.tabRankings },
  ];

  return (
    <>
      <div role="tablist" aria-label={t.tournament.teamsTitle} className="mb-4 flex gap-1.5">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            id={`team-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`team-panel-${id}`}
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? "border-brand bg-brand text-neutral-950" : "border-green-line text-ink hover:bg-green-tint"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

        <div id={`team-panel-${tab}`} role="tabpanel" aria-labelledby={`team-tab-${tab}`} className="grid gap-4 md:grid-cols-2">
          {TEAMS.map((team) => {
            const style = TEAM_CARD[team.id];
            return (
              <article key={team.id} className={`rounded-2xl border-2 p-4 shadow-sm sm:p-5 ${style.card}`}>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl font-semibold tracking-wide">{teamNames[team.id]}</h3>
                    <p className={`text-xs ${style.sub}`}>
                      {fmt(t.tournament.teamSize, { players: team.pairs.length * 2, pairs: team.pairs.length })}
                    </p>
                  </div>
                  {tab === "rankings" && (
                    <div className="shrink-0 text-right">
                      <p className={`text-[11px] ${style.sub}`}>{t.tournament.teamPoints}</p>
                      <p className="text-2xl font-bold leading-tight tabular-nums">
                        {fmt(t.tournament.points, { count: teamPoints[team.id] })}
                      </p>
                    </div>
                  )}
                </div>

                {tab !== "rankings" ? (
                  <ol>
                    {/* 스페셜 페어: row n of 흑팀 plays row n of 백팀. */}
                    {(tab === "pairs"
                      ? team.pairs.map((pair) => pair.members.map((m) => m.name))
                      : SPECIAL_MATCHUPS.map((m) => m[team.id].map((id) => getParticipant(id)?.name ?? "?"))
                    ).map(([a, b], i) => (
                      <li key={i} className={`flex items-center gap-3 border-t py-2.5 ${style.row}`}>
                        {/* 고정 페어 are lettered A–E; 스페셜 페어 are numbered so matching rows read as matchups. */}
                        <Num className={style.num} label={fmt(t.tournament.pairLabel, { n: label(tab, i) })}>
                          {label(tab, i)}
                        </Num>
                        <span className="min-w-0 text-[15px] font-medium">
                          {a} <span className={style.sub}>/</span> {b}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ol>
                    {rankings[team.id].map((p) => {
                      const open = openId === p.id;
                      return (
                        <li key={p.id} className={`border-t ${style.row}`}>
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`player-${p.id}`}
                            onClick={() => setOpenId(open ? null : p.id)}
                            className="flex w-full items-center gap-3 py-2 text-left"
                          >
                            <Num className={style.num} label={fmt(t.tournament.rankLabel, { n: p.rank })}>{p.rank}</Num>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-medium">{p.name}</span>
                              <span className={`block truncate text-[11px] ${style.sub}`}>
                                {fmt(t.tournament.played, { played: p.played })}
                                {p.played > 0 && ` · ${fmt(t.tournament.gameDiff, { diff: signed(p.gameDiff) })}`}
                              </span>
                            </span>
                            <span className="shrink-0 text-base font-bold tabular-nums">
                              {fmt(t.tournament.points, { count: p.points })}
                            </span>
                            <span aria-hidden className={`shrink-0 text-xs transition-transform ${style.sub} ${open ? "rotate-180" : ""}`}>
                              ▾
                            </span>
                          </button>
                          {open && <PlayerMatches id={p.id} matches={matches} subClass={style.sub} rowClass={style.row} />}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      {tab === "special" && <p className="mt-2 text-xs text-muted">{t.tournament.specialNote}</p>}
      {tab === "rankings" && <p className="mt-2 text-xs text-muted">{t.tournament.pointsRule}</p>}
    </>
  );
}

/** One player's matches: partner, opponents and a short result from their side. */
function PlayerMatches({
  id,
  matches,
  subClass,
  rowClass,
}: {
  id: string;
  matches: TournamentMatch[];
  subClass: string;
  rowClass: string;
}) {
  const { t } = useI18n();
  const name = (pid: string) => getParticipant(pid)?.name ?? "?";
  const mine = matches
    .filter((m) => [...side1(m), ...side2(m)].includes(id))
    .sort((a, b) => MATCH_KINDS.indexOf(a.kind) - MATCH_KINDS.indexOf(b.kind));
  const kindText = { pair: t.tournament.kindPair, special: t.tournament.kindSpecial };

  return (
    <div id={`player-${id}`} className="pb-3 pl-9">
      {mine.length === 0 ? (
        <p className={`text-xs ${subClass}`}>{t.tournament.noPlayerMatches}</p>
      ) : (
        <ul className="space-y-1.5">
          {mine.map((m) => {
            const onSide1 = side1(m).includes(id);
            const [us, them] = onSide1 ? [side1(m), side2(m)] : [side2(m), side1(m)];
            const partner = us.find((x) => x !== id)!;
            const mySide = onSide1 ? "side1" : "side2";
            const scores = m.score1 !== null && m.score2 !== null ? (onSide1 ? [m.score1, m.score2] : [m.score2, m.score1]) : null;
            const result =
              m.status !== "final" || !m.winner
                ? m.status === "in_progress"
                  ? t.tournament.statusInProgress
                  : t.tournament.statusScheduled
                : m.winner === "draw"
                  ? t.tournament.resultDraw
                  : m.winner === mySide
                    ? t.tournament.resultWin
                    : t.tournament.resultLoss;
            const decided = m.status === "final" && !!m.winner;

            return (
              <li key={m.id} className={`rounded-lg border px-2.5 py-2 text-xs ${rowClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium ${subClass}`}>{kindText[m.kind]}</span>
                  <span className={`shrink-0 tabular-nums ${decided ? "font-bold" : subClass}`}>
                    {result}
                    {scores && ` ${scores[0]}–${scores[1]}`}
                  </span>
                </div>
                <p className="mt-0.5 truncate">
                  <span className={subClass}>{t.tournament.partnerLabel}</span> {name(partner)}
                </p>
                <p className="truncate">
                  <span className={subClass}>{t.common.vs}</span> {them.map(name).join(" / ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const label = (tab: Tab, i: number) => (tab === "pairs" ? String.fromCharCode(65 + i) : String(i + 1));

function Num({ className, label, children }: { className: string; label: string; children: string | number }) {
  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums ${className}`}
      aria-label={label}
    >
      {children}
    </span>
  );
}

/** A small team marker: ■ for 흑팀, □ for 백팀, with the team name for screen readers. */
export function TeamMark({ teamId, name }: { teamId: TeamId; name: string }) {
  return (
    <span
      title={name}
      className={`inline-block size-2.5 shrink-0 rounded-[2px] border border-neutral-500 ${
        teamId === "black" ? "bg-neutral-950" : "bg-white"
      }`}
    >
      <span className="sr-only">{name}</span>
    </span>
  );
}
