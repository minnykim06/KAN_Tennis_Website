import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RankingsTable } from "@/components/rankings/RankingsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentPlayer } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getStandings } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.rankings.title };
}

export default async function RankingsPage() {
  const [{ t }, standings, player] = await Promise.all([getI18n(), getStandings(), getCurrentPlayer()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <PageHeader title={t.rankings.title} subtitle={t.rankings.subtitle} />
      {standings.length === 0 ? (
        <EmptyState>{t.rankings.empty}</EmptyState>
      ) : (
        <>
          <RankingsTable standings={standings} currentPlayerId={player?.id} t={t.rankings} />
          <p className="mt-3 text-xs text-muted">
            {t.rankings.tiebreak}
            <br />
            {t.rankings.gameDiffNote}
            <br />
            {t.rankings.doublesNote}
          </p>
        </>
      )}
    </div>
  );
}
