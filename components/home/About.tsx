import { INSTAGRAM_URL } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";
import { button } from "@/components/ui/styles";

export function About({ t }: { t: Dictionary }) {
  const info = [
    { icon: "📅", text: t.home.everyThursday },
    { icon: "🕖", text: t.home.hours },
    { icon: "📍", text: t.home.place },
  ];

  return (
    <section aria-labelledby="about" className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
      <h2 id="about" className="font-serif text-2xl font-semibold text-green sm:text-3xl">
        {t.home.aboutTitle}
      </h2>
      <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/90 sm:text-base">
        <p>{t.home.aboutP1}</p>
        <p>{t.home.aboutP2}</p>
      </div>

      <ul className="mt-8 grid grid-cols-3 divide-x divide-green-line rounded-2xl border border-green-line bg-surface">
        {info.map(({ icon, text }) => (
          <li key={icon} className="flex flex-col items-center gap-1 px-2 py-4">
            <span aria-hidden className="text-2xl">
              {icon}
            </span>
            <span className="text-xs font-medium text-green sm:text-sm">{text}</span>
          </li>
        ))}
      </ul>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${button.primary} mt-8 px-6 py-3 text-base`}
      >
        <InstagramIcon />
        {t.home.instagram}
        <span className="font-normal opacity-80">@kantennis_</span>
      </a>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
