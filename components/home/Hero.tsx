import Image from "next/image";
import type { Dictionary } from "@/lib/i18n";

export function Hero({ t }: { t: Dictionary }) {
  return (
    <section className="border-b border-green-line/50 bg-gradient-to-b from-green-tint/70 to-page">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-14 pt-12 text-center sm:pb-20 sm:pt-16">
        {/* The badge stays on white, even in night mode. */}
        <Image
          src="/logo.png"
          alt="KAN Tennis · San Diego"
          width={176}
          height={176}
          priority
          className="size-36 rounded-full bg-white shadow-lg ring-4 ring-white sm:size-44"
        />
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-[0.08em] text-green sm:text-6xl">KAN Tennis</h1>
        <p className="mt-2 font-serif text-sm uppercase tracking-[0.4em] text-muted sm:text-base">San Diego</p>
        <div aria-hidden className="mx-auto mt-5 h-px w-16 bg-gold/70" />
        <p className="mt-5 max-w-md text-lg text-ink/80">{t.home.tagline}</p>
      </div>
    </section>
  );
}
