import Link from "next/link";
import { fmt } from "@/lib/i18n";
import { card } from "@/components/ui/styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameDayBody, GameDayHeading, type GameDayCardProps } from "./GameDayCard";
import { GameDayAdmin } from "./admin/GameDayAdmin";

export const PAST_PAGE_SIZE = 5;

/** Past game days, latest first, collapsed and paginated via ?past=N. */
export function PastGameDays({
  gameDays,
  page,
  ...shared
}: Omit<GameDayCardProps, "gameDay"> & { gameDays: GameDayCardProps["gameDay"][]; page: number }) {
  const { t, lang, admin } = shared;
  if (gameDays.length === 0) return <EmptyState>{t.gameDay.noPast}</EmptyState>;

  const totalPages = Math.ceil(gameDays.length / PAST_PAGE_SIZE);
  const current = Math.min(Math.max(page, 1), totalPages);
  const visible = gameDays.slice((current - 1) * PAST_PAGE_SIZE, current * PAST_PAGE_SIZE);

  return (
    <>
      <div className="space-y-3">
        {visible.map((gameDay) => (
          <details key={gameDay.id} id={`game-day-${gameDay.id}`} className={`${card} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
              <GameDayHeading gameDay={gameDay} lang={lang} t={t} />
              <span aria-hidden className="text-green transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="border-t border-green-line/50 px-4 pb-4 sm:px-6 sm:pb-6">
              {admin && <GameDayAdmin gameDay={gameDay} />}
              <GameDayBody gameDay={gameDay} {...shared} />
            </div>
          </details>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm">
          {current > 1 ? (
            <Link href={`/game-day?past=${current - 1}#past`} className="font-medium text-green" scroll={false}>
              {t.gameDay.newer}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">{fmt(t.gameDay.pageOf, { page: current, total: totalPages })}</span>
          {current < totalPages ? (
            <Link href={`/game-day?past=${current + 1}#past`} className="font-medium text-green" scroll={false}>
              {t.gameDay.older}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
