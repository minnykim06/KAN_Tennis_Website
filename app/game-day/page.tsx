import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { GameDayCard } from "@/components/game-day/GameDayCard";
import { NextMatchCallout, findNextMatch } from "@/components/game-day/NextMatchCallout";
import { PastGameDays } from "@/components/game-day/PastGameDays";
import { CreateGameDayPanel } from "@/components/game-day/admin/CreateGameDayPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentPlayer } from "@/lib/auth/session";
import { REGULAR_SCHEDULE } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";
import { getGameDays, getPlayers, nextOpenRegularDay } from "@/lib/queries";
import { formatDate } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.gameDay.title };
}

export default async function GameDayPage({ searchParams }: PageProps<"/game-day">) {
  const [{ lang, t }, player, { upcoming, past }, players, params] = await Promise.all([
    getI18n(),
    getCurrentPlayer(),
    getGameDays(),
    getPlayers(),
    searchParams,
  ]);

  const isModerator = player?.role === "moderator";
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const shared = { names, meId: player?.id, lang, t, admin: isModerator ? { players } : undefined };
  const next = player ? findNextMatch(upcoming, player.id) : null;
  const nextDate = isModerator ? await nextOpenRegularDay() : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <PageHeader title={t.gameDay.title} subtitle={t.gameDay.subtitle} />

      {nextDate && (
        <CreateGameDayPanel
          nextDateLabel={formatDate(nextDate, lang)}
          defaults={{
            date: nextDate,
            start_time: REGULAR_SCHEDULE.startTime,
            end_time: REGULAR_SCHEDULE.endTime,
            location: REGULAR_SCHEDULE.location,
            format: REGULAR_SCHEDULE.format,
          }}
        />
      )}

      {player && next && <NextMatchCallout next={next} playerId={player.id} names={names} lang={lang} t={t} />}

      <section aria-labelledby="upcoming">
        <h2 id="upcoming" className="mb-4 font-serif text-xl font-semibold text-ink">
          {t.gameDay.upcoming}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState>{t.gameDay.noUpcoming}</EmptyState>
        ) : (
          <div className="space-y-4">
            {upcoming.map((gameDay) => (
              <GameDayCard key={gameDay.id} gameDay={gameDay} {...shared} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="past" className="mt-12 scroll-mt-28">
        <h2 id="past" className="mb-4 font-serif text-xl font-semibold text-ink">
          {t.gameDay.past}
        </h2>
        <PastGameDays gameDays={past} page={Number(params.past) || 1} {...shared} />
      </section>
    </div>
  );
}
