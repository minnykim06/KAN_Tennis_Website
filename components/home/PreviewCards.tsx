import Link from "next/link";
import { fmt, type Dictionary, type Lang } from "@/lib/i18n";
import type { Standing } from "@/lib/ranking";
import { formatDate, formatTimeRange } from "@/lib/time";
import type { GameDay } from "@/lib/types";
import { card } from "@/components/ui/styles";

function CardShell({ title, href, linkText, children }: { title: string; href: string; linkText: string; children: React.ReactNode }) {
  return (
    <div className={`${card} flex flex-col p-5 sm:p-6`}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
      <Link href={href} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-green hover:underline">
        {linkText} →
      </Link>
    </div>
  );
}

export function NextGameDayCard({ gameDay, lang, t }: { gameDay?: GameDay; lang: Lang; t: Dictionary }) {
  return (
    <CardShell title={t.home.nextGameDay} href="/game-day" linkText={t.home.viewGameDay}>
      {gameDay ? (
        <>
          <p className="font-serif text-2xl font-semibold text-green">{formatDate(gameDay.date, lang, { long: true })}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/85">
            <li>🕖 {formatTimeRange(gameDay.start_time, gameDay.end_time, lang)}</li>
            <li>📍 {gameDay.location}</li>
            <li>
              🎾 {gameDay.format === "doubles" ? t.gameDay.doubles : t.gameDay.singles} ·{" "}
              {fmt(t.gameDay.matches, { count: gameDay.matches.length })}
            </li>
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">{t.home.noUpcoming}</p>
      )}
    </CardShell>
  );
}

const MEDALS: Record<number, string> = { 1: "bg-gold", 2: "bg-silver", 3: "bg-bronze" };

export function Top3Card({ standings, t }: { standings: Standing[]; t: Dictionary }) {
  const top = standings.filter((s) => s.rank !== null).slice(0, 3);
  return (
    <CardShell title={t.home.top3} href="/rankings" linkText={t.home.viewRankings}>
      {top.length === 0 ? (
        <p className="text-sm text-muted">{t.home.noRankings}</p>
      ) : (
        <ol className="space-y-2">
          {top.map((s) => (
            <li key={s.playerId} className="flex items-center gap-3 rounded-xl bg-green-tint/60 px-3 py-2.5">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${MEDALS[s.rank ?? 0] ?? "bg-brand"}`}>
                {s.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-green">
                {fmt(t.home.pointsShort, { points: s.points })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </CardShell>
  );
}
