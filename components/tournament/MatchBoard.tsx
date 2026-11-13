"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { input } from "@/components/ui/styles";
import { fmt, type Lang } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatTime } from "@/lib/time";
import {
  PAIR_MATCHES_PER_PAIR,
  PAIR_SCHEDULE,
  PARTICIPANTS,
  PLANNED_PAIR_MATCHES,
  SPECIAL_MATCHES,
  TEAMS,
  getParticipant,
  type PairDraw as PairDrawData,
  type TeamId,
} from "@/lib/tournament/fall-2026";
import {
  MATCH_KINDS,
  side1,
  side2,
  tournamentMatchPlayers,
  type TournamentMatch,
  type TournamentMatchKind,
} from "@/lib/tournament/types";
import { TeamMark } from "./TeamCards";
import { PairDraw } from "./admin/PairDraw";
import { TournamentMatchAdmin, TournamentScoreEntry } from "./admin/TournamentMatchAdmin";

/** 대진·결과, split into a 고정 페어 tab and a 스페셜 페어 tab. */
export function MatchBoard({
  matches,
  teamNames,
  lang,
  canEdit,
  canScore,
  draw,
  canDraw,
}: {
  matches: TournamentMatch[];
  teamNames: Record<TeamId, string>;
  lang: Lang;
  /** The 제비뽑기, or null before it's entered. */
  draw: PairDrawData | null;
  /** Migration 0008 run: moderators can enter the draw. */
  canDraw: boolean;
  /** Moderator: add, edit and delete matches. */
  canEdit: boolean;
  /** Any signed-in player: enter results, like game day. */
  canScore: boolean;
}) {
  const { t } = useI18n();
  const [kind, setKind] = useState<TournamentMatchKind>("pair");
  const [player, setPlayer] = useState("");

  // 고정 페어 matches from the draw in schedule order (1–15).
  const ofKind = matches
    .filter((m) => m.kind === kind)
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99));
  const visible = ofKind.filter((m) => !player || tournamentMatchPlayers(m).includes(player));

  const tabLabel: Record<TournamentMatchKind, string> = {
    pair: t.tournament.kindPair,
    special: t.tournament.kindSpecial,
  };
  // Planned counts only: never shown as if the matches already existed.
  const planned =
    kind === "pair"
      ? fmt(t.tournament.plannedPair, { total: PLANNED_PAIR_MATCHES, each: PAIR_MATCHES_PER_PAIR })
      : fmt(t.tournament.plannedSpecial, { total: SPECIAL_MATCHES });

  return (
    <>
      <div role="tablist" aria-label={t.tournament.matchesTitle} className="mb-3 flex gap-1.5">
        {MATCH_KINDS.map((k) => (
          <button
            key={k}
            id={`match-tab-${k}`}
            type="button"
            role="tab"
            aria-selected={kind === k}
            aria-controls="match-panel"
            onClick={() => setKind(k)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              kind === k ? "border-brand bg-brand text-neutral-950" : "border-green-line text-ink hover:bg-green-tint"
            }`}
          >
            {tabLabel[k]}
          </button>
        ))}
      </div>

      <div id="match-panel" role="tabpanel" aria-labelledby={`match-tab-${kind}`}>
        <p className="mb-4 text-sm text-muted">{planned}</p>

        {ofKind.length === 0 ? (
          <EmptyState>
            <p className="text-base font-semibold text-ink">{t.tournament.noMatchesTitle}</p>
            <p className="mt-1">{t.tournament.noMatchesText}</p>
          </EmptyState>
        ) : (
          <>
            <div className="mb-4">
              <label className="sr-only" htmlFor="match-player-filter">{t.tournament.filterPlayer}</label>
              <select
                id="match-player-filter"
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                className={`${input} sm:max-w-56`}
              >
                <option value="">{t.tournament.filterAllPlayers}</option>
                {TEAMS.map((team) => (
                  <optgroup key={team.id} label={teamNames[team.id]}>
                    {PARTICIPANTS.filter((p) => p.teamId === team.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-green-line px-4 py-6 text-center text-sm text-muted">{t.tournament.filterEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {visible.map((m) => (
                  <TournamentMatchRow key={m.id} match={m} teamNames={teamNames} lang={lang} highlight={player} canEdit={canEdit} canScore={canScore} />
                ))}
              </ul>
            )}
          </>
        )}
        {/* 스페셜 페어 matchups are set in advance (migration 0006), so only 고정 페어 can be added. */}
        {canEdit && kind === "pair" && <PairDraw draw={draw} canDraw={canDraw} />}
      </div>
    </>
  );
}

function TournamentMatchRow({
  match,
  teamNames,
  lang,
  highlight,
  canEdit,
  canScore,
}: {
  match: TournamentMatch;
  teamNames: Record<TeamId, string>;
  lang: Lang;
  highlight: string;
  canEdit: boolean;
  canScore: boolean;
}) {
  const { t } = useI18n();
  const winner = match.status === "final" ? match.winner : null;
  const winIdx = winner === "side1" ? 0 : winner === "side2" ? 1 : -1;
  const hasScore = match.score1 !== null && match.score2 !== null;
  const sideClass = (i: number) => (winIdx === -1 ? "text-ink" : winIdx === i ? "font-semibold text-ink" : "text-muted");

  const status = {
    scheduled: { text: t.tournament.statusScheduled, cls: "border border-green-line text-muted" },
    in_progress: { text: t.tournament.statusInProgress, cls: "border border-brand bg-surface text-ink font-semibold" },
    final: { text: t.tournament.statusFinal, cls: "bg-brand text-white" },
  }[match.status];

  return (
    <li className="rounded-xl border border-green-line bg-surface px-3 py-3 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {match.slot !== null && (
          <span className="font-semibold text-ink">
            {fmt(t.tournament.matchNo, { n: match.slot })} ·{" "}
            {fmt(t.tournament.matchLetters, { b: PAIR_SCHEDULE[match.slot - 1][0], w: PAIR_SCHEDULE[match.slot - 1][1] })}
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${status.cls}`}>{status.text}</span>
        {match.start_time && <span>{formatTime(match.start_time, lang)}</span>}
        {match.court && <span>{fmt(t.tournament.court, { court: match.court })}</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[15px] leading-snug">
        {[side1(match), side2(match)].map((ids, i) => (
          <div key={i} className={`min-w-0 ${i === 0 ? "text-left" : "col-start-3 text-right"} ${sideClass(i)}`}>
            {ids.map((id) => {
              const p = getParticipant(id);
              return (
                <p key={id} className={`flex items-center gap-1.5 ${i === 1 ? "justify-end" : ""}`}>
                  {p && i === 0 && <TeamMark teamId={p.teamId} name={teamNames[p.teamId]} />}
                  <span className={`truncate ${highlight === id ? "underline decoration-2 underline-offset-4" : ""}`}>
                    {p?.name ?? "?"}
                  </span>
                  {p && i === 1 && <TeamMark teamId={p.teamId} name={teamNames[p.teamId]} />}
                </p>
              );
            })}
          </div>
        ))}
        <div className="col-start-2 row-start-1 flex flex-col items-center gap-1 px-1 text-center">
          {hasScore ? (
            <p className="whitespace-nowrap text-xl font-semibold tabular-nums leading-tight">
              <span className={sideClass(0)}>{match.score1}</span>
              <span className="mx-1.5 text-sm font-normal text-muted">–</span>
              <span className={sideClass(1)}>{match.score2}</span>
            </p>
          ) : (
            <span className="text-xs font-medium uppercase text-muted">{t.common.vs}</span>
          )}
          {winner === "draw" && (
            <span className="rounded-full border border-green-line px-2 py-0.5 text-[11px] text-ink">{t.tournament.draw}</span>
          )}
        </div>
      </div>

      {canEdit ? <TournamentMatchAdmin match={match} /> : canScore && <TournamentScoreEntry match={match} />}
    </li>
  );
}
