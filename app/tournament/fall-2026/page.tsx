import type { Metadata } from "next";
import { MatchBoard } from "@/components/tournament/MatchBoard";
import { TeamSection } from "@/components/tournament/TeamCards";
import { getCurrentPlayer } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import type { TeamId } from "@/lib/tournament/fall-2026";
import { getTournamentData } from "@/lib/tournament/queries";
import { computeTeamPoints, rankPlayersByTeam } from "@/lib/tournament/points";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.tournament.title };
}

export default async function Fall2026TournamentPage() {
  const [{ lang, t }, player, data] = await Promise.all([getI18n(), getCurrentPlayer(), getTournamentData()]);
  const isModerator = player?.role === "moderator";

  // Display names are kept apart from the internal team ids, so they can be renamed in the translations.
  const teamNames: Record<TeamId, string> = { black: t.tournament.teamBlack, white: t.tournament.teamWhite };

  const teamPoints = computeTeamPoints(data.matches);

  const sectionTitle = "mb-3 font-serif text-xl font-semibold text-ink";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-green sm:text-4xl">{t.tournament.title}</h1>
        <p className="mt-1 text-lg font-medium text-ink">{t.tournament.subtitle}</p>
        <p className="mt-2 inline-block rounded-full border border-green-line px-3 py-1 text-sm text-muted">
          {t.tournament.date}
        </p>
      </header>

      <section aria-labelledby="teams" className="mb-10">
        <h2 id="teams" className={sectionTitle}>{t.tournament.teamsTitle}</h2>
        <TeamSection teamNames={teamNames} rankings={rankPlayersByTeam(data.matches)} teamPoints={teamPoints} matches={data.matches} />
      </section>

      <section aria-labelledby="matches">
        <h2 id="matches" className={sectionTitle}>{t.tournament.matchesTitle}</h2>
        <MatchBoard
          matches={data.matches}
          teamNames={teamNames}
          lang={lang}
          canEdit={isModerator && data.ready}
          canScore={!!player && data.ready}
        />
      </section>
    </div>
  );
}
