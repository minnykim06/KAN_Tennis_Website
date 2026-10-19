import { fmt, type Dictionary, type Lang } from "@/lib/i18n";
import { formatDate, formatTimeRange } from "@/lib/time";
import { matchPlayers, type GameDay, type Player } from "@/lib/types";
import { card } from "@/components/ui/styles";
import { MatchRow } from "./MatchRow";
import { GameDayAdmin } from "./admin/GameDayAdmin";
import { MatchAdmin } from "./admin/MatchAdmin";
import { AddMatch } from "./admin/AddMatch";

export type GameDayCardProps = {
  gameDay: GameDay;
  names: Record<string, string>;
  meId?: string;
  lang: Lang;
  t: Dictionary;
  /** Present only for moderators: enables the editing tools. */
  admin?: { players: Player[] };
};

export function FormatBadge({ format, t }: { format: GameDay["format"]; t: Dictionary }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold tracking-wide ${
        format === "doubles" ? "bg-brand text-white" : "border border-green text-green"
      }`}
    >
      {format === "doubles" ? t.gameDay.doubles : t.gameDay.singles}
    </span>
  );
}

export function GameDayHeading({ gameDay, lang, t }: { gameDay: GameDay; lang: Lang; t: Dictionary }) {
  return (
    <div className="min-w-0">
      <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-serif text-lg font-semibold text-green sm:text-xl">
        {formatDate(gameDay.date, lang, { long: true })}
        <FormatBadge format={gameDay.format} t={t} />
      </h3>
      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted">
        <span>🕖 {formatTimeRange(gameDay.start_time, gameDay.end_time, lang)}</span>
        <span>📍 {gameDay.location}</span>
        <span>{fmt(t.gameDay.matches, { count: gameDay.matches.length })}</span>
      </p>
    </div>
  );
}

/** The body of a game day: notes, matchups and (for moderators) editing tools. */
export function GameDayBody({ gameDay, names, meId, t, admin }: GameDayCardProps) {
  return (
    <>
      {gameDay.notes && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-green-tint/60 px-3 py-2 text-sm">{gameDay.notes}</p>
      )}

      {gameDay.matches.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.gameDay.noMatches}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {gameDay.matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              names={names}
              isMine={!!meId && matchPlayers(match).includes(meId)}
              t={t}
              admin={
                admin && (
                  <MatchAdmin match={match} format={gameDay.format} players={admin.players} dayMatches={gameDay.matches} />
                )
              }
            />
          ))}
        </ul>
      )}

      {admin && (
        <AddMatch gameDayId={gameDay.id} format={gameDay.format} players={admin.players} dayMatches={gameDay.matches} />
      )}
    </>
  );
}

export function GameDayCard(props: GameDayCardProps) {
  const { gameDay, lang, t, admin } = props;
  return (
    <article id={`game-day-${gameDay.id}`} className={`${card} p-4 sm:p-6`}>
      <GameDayHeading gameDay={gameDay} lang={lang} t={t} />
      {admin && <GameDayAdmin gameDay={gameDay} />}
      <GameDayBody {...props} />
    </article>
  );
}
