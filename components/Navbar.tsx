import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getCurrentPlayer } from "@/lib/auth/session";
import { fmt } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { NavLinks } from "./NavLinks";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { SignInButton } from "./auth/SignInButton";

export async function Navbar() {
  const [{ t }, player] = await Promise.all([getI18n(), getCurrentPlayer()]);

  return (
    <header className="sticky top-0 z-30 border-b border-green-line/60 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="KAN Tennis" width={40} height={40} className="size-9 rounded-full bg-white sm:size-10" priority />
          <span className="hidden font-serif text-lg font-semibold tracking-wide text-green sm:inline">
            KAN Tennis
          </span>
        </Link>

        <NavLinks className="hidden md:flex" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LangToggle />
          {player ? (
            <form action={signOut} className="flex items-center gap-1 text-sm">
              <Link
                href="/account"
                title={t.nav.account}
                className="max-w-[5rem] truncate rounded-full px-1 py-1 text-ink underline-offset-4 hover:text-green hover:underline min-[400px]:max-w-[9rem] min-[400px]:px-2 sm:max-w-none"
              >
                {fmt(t.nav.hi, { name: player.name })}
              </Link>
              <span aria-hidden className="text-muted">
                ·
              </span>
              <button type="submit" className="whitespace-nowrap rounded-full px-1 py-1 min-[400px]:px-2 font-medium text-green hover:bg-green-tint">
                {t.nav.signOut}
              </button>
            </form>
          ) : (
            <SignInButton className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
              {t.nav.signIn}
            </SignInButton>
          )}
        </div>
      </div>

      {/* Mobile: links on their own row so they're always one tap away */}
      <NavLinks className="flex justify-around border-t border-green-line/40 px-2 md:hidden" />
    </header>
  );
}
