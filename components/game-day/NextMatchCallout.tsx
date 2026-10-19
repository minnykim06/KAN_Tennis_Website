import { fmt, type Dictionary, type Lang } from "@/lib/i18n";
import { formatDate, formatTimeRange } from "@/lib/time";
import { matchPlayers, team1, team2, type GameDay } from "@/lib/types";
import { teamName } from "./MatchRow";

/** First pending match for the signed-in player among upcoming game days. */
export function findNextMatch(upcoming: GameDay[], playerId: string) {
  for (const gameDay of upcoming) {
    const match = gameDay.matches.find(
      (m) => m.result === "pending" && matchPlayers(m).includes(playerId),
    );
    if (match) return { gameDay, match };
  }
  return null;
}

export function NextMatchCallout({
  next,
  playerId,
  names,
  lang,
  t,
}: {
  next: NonNullable<ReturnType<typeof findNextMatch>>;
  playerId: string;
  names: Record<string, string>;
  lang: Lang;
  t: Dictionary;
}) {
  const { gameDay, match } = next;
  const onTeam1 = team1(match).includes(playerId);
  const opponents = onTeam1 ? team2(match) : team1(match);
  const partner = (onTeam1 ? team1(match) : team2(match)).find((id) => id !== playerId);

  return (
    <a
      href={`#game-day-${gameDay.id}`}
      className="mb-8 block rounded-2xl bg-brand p-5 text-white shadow-md transition-transform hover:-translate-y-0.5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">🎾 {t.gameDay.yourNextMatch}</p>
      <p className="mt-2 font-serif text-2xl font-semibold">
        {fmt(t.gameDay.against, { name: teamName(opponents, names) })}
      </p>
      {partner && <p className="mt-1 text-sm text-white/85">🤝 {fmt(t.gameDay.partner, { name: names[partner] ?? "?" })}</p>}
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
        <span>📅 {formatDate(gameDay.date, lang, { long: true })}</span>
        <span>🕖 {formatTimeRange(gameDay.start_time, gameDay.end_time, lang)}</span>
        <span>📍 {gameDay.location}</span>
        {match.court && <span>{fmt(t.gameDay.court, { court: match.court })}</span>}
      </p>
    </a>
  );
}
