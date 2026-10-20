import type { ReactNode } from "react";
import { fmt, type Dictionary } from "@/lib/i18n";
import { parseScore } from "@/lib/score";
import { team1, team2, type Match } from "@/lib/types";

/** "Jason Choi" for singles, "Jason Choi / 박지호" for doubles. */
export function teamName(ids: string[], names: Record<string, string>): string {
  return ids.map((id) => names[id] ?? "?").join(" / ");
}

export function MatchRow({
  match,
  names,
  isMine,
  t,
  admin,
}: {
  match: Match;
  names: Record<string, string>;
  isMine: boolean;
  t: Dictionary;
  admin?: ReactNode;
}) {
  const sides = [team1(match), team2(match)].map((ids) => ids.map((id) => names[id] ?? "?"));
  const winner = match.result === "player1_win" ? 0 : match.result === "player2_win" ? 1 : -1;
  const sideClass = (i: number) => (winner === -1 ? "text-ink" : winner === i ? "font-semibold text-green" : "text-muted");

  return (
    <li
      className={`rounded-xl px-3 py-3 sm:px-4 ${
        isMine ? "bg-green-tint ring-1 ring-green/30" : "bg-surface"
      }`}
    >
      {/* Team 1 · score/vs · Team 2, side by side. Partners stack so names never wrap mid-name. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[15px] leading-snug">
        {sides.map((team, i) => (
          <div
            key={i}
            className={`min-w-0 ${i === 0 ? "text-left" : "col-start-3 text-right"} ${sideClass(i)}`}
          >
            {team.map((n, j) => (
              <p key={j} className="truncate">
                {j === 0 && winner === i && i === 0 && <span aria-hidden>🏆 </span>}
                {n}
                {j === 0 && winner === i && i === 1 && <span aria-hidden> 🏆</span>}
              </p>
            ))}
          </div>
        ))}
        <div className="col-start-2 row-start-1">
          <Center match={match} winner={winner} t={t} />
        </div>
      </div>

      {(match.court || isMine) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {match.court && <span>{fmt(t.gameDay.court, { court: match.court })}</span>}
          {isMine && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {t.gameDay.myMatch}
            </span>
          )}
        </p>
      )}
      {match.note && <p className="mt-2 whitespace-pre-line text-sm text-muted">📝 {match.note}</p>}
      {admin}
    </li>
  );
}

/** The score between the two teams (Team 1's games on the left), or "vs" plus a pending/draw pill. */
function Center({ match, winner, t }: { match: Match; winner: number; t: Dictionary }) {
  const sets = match.score ? parseScore(match.score) : null;
  const num = (i: number) => (winner === -1 ? "text-ink" : winner === i ? "text-green" : "text-muted");
  const pill =
    match.result === "pending" ? (
      <span className="rounded-full border border-green-line px-2.5 py-0.5 text-xs text-muted">{t.results.pending}</span>
    ) : match.result === "draw" ? (
      <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">{t.results.draw}</span>
    ) : null;

  return (
    <div className="flex flex-col items-center gap-1 px-1 text-center">
      {sets ? (
        sets.map(([a, b], k) => (
          <p key={k} className="whitespace-nowrap text-xl font-semibold tabular-nums leading-tight">
            <span className={num(0)}>{a}</span>
            <span className="mx-1.5 text-sm font-normal text-muted">–</span>
            <span className={num(1)}>{b}</span>
          </p>
        ))
      ) : match.score ? (
        <p className="text-sm font-medium text-ink">{match.score}</p>
      ) : (
        <span className="text-xs font-medium uppercase text-muted">{t.common.vs}</span>
      )}
      {pill}
    </div>
  );
}
