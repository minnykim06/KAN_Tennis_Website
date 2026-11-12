import { fmt, type Dictionary } from "@/lib/i18n";
import type { TeamId } from "@/lib/tournament/fall-2026";
import { TEAM_CARD } from "./teamStyle";

/** 흑팀 vs 백팀 team 승점, with how many matches are finished (and the winner once ended). */
export function Scoreboard({
  teamNames,
  teamPoints,
  done,
  total,
  ended,
  t,
}: {
  teamNames: Record<TeamId, string>;
  teamPoints: Record<TeamId, number>;
  /** Finished matches with a result. */
  done: number;
  /** All planned matches (고정 페어 + 스페셜 페어). */
  total: number;
  ended: boolean;
  t: Dictionary;
}) {
  const { black, white } = teamPoints;
  const leader: TeamId | null = black > white ? "black" : white > black ? "white" : null;

  return (
    <section aria-label={ended ? t.tournament.scoreFinal : t.tournament.scoreTitle} className="mb-10">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {ended ? t.tournament.scoreFinal : t.tournament.scoreTitle}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-3">
        {(["black", "white"] as const).map((team, i) => (
          <div
            key={team}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 sm:py-5 ${TEAM_CARD[team].card} ${
              i === 1 ? "col-start-3" : ""
            }`}
          >
            <p className={`text-sm font-medium ${TEAM_CARD[team].sub}`}>{teamNames[team]}</p>
            <p className="font-serif text-5xl font-bold leading-tight tabular-nums sm:text-6xl">{teamPoints[team]}</p>
          </div>
        ))}
        <span aria-hidden className="col-start-2 row-start-1 self-center text-2xl font-bold text-muted">
          :
        </span>
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {ended ? (
          <span className="font-semibold text-ink">
            {leader ? fmt(t.tournament.winner, { team: teamNames[leader] }) : t.tournament.tie}
          </span>
        ) : (
          fmt(t.tournament.scoreProgress, { done, total })
        )}
      </p>
    </section>
  );
}
