import { About } from "@/components/home/About";
import { Hero } from "@/components/home/Hero";
import { NextGameDayCard, Top3Card } from "@/components/home/PreviewCards";
import { SignInButton } from "@/components/auth/SignInButton";
import { getCurrentPlayer } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getGameDays, getStandings } from "@/lib/queries";

export default async function Home() {
  const [{ lang, t }, { upcoming }, standings, player] = await Promise.all([
    getI18n(),
    getGameDays(),
    getStandings(),
    getCurrentPlayer(),
  ]);

  return (
    <>
      <Hero t={t} />
      <About t={t} />

      <section className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 sm:gap-6">
        <NextGameDayCard gameDay={upcoming[0]} lang={lang} t={t} />
        <Top3Card standings={standings} t={t} />
      </section>

      {!player && (
        <section className="mx-auto mt-12 max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-brand px-6 py-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-serif text-xl font-semibold">{t.home.joinTitle}</h2>
              <p className="mt-1 text-sm text-white/80">{t.home.joinText}</p>
            </div>
            <SignInButton className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-white/90">
              {t.nav.signIn}
            </SignInButton>
          </div>
        </section>
      )}
    </>
  );
}
