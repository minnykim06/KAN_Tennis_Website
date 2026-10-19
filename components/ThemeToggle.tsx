"use client";

import { useI18n } from "@/lib/i18n/client";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Switches between light and night mode instantly (no reload) and remembers
 * the choice in a cookie so the server renders the same theme next time.
 */
export function ThemeToggle() {
  const { t } = useI18n();

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  // Both icons are rendered; CSS shows the one for the current theme, so the
  // server-rendered HTML is correct before any JavaScript runs.
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-green-line text-green transition-colors hover:bg-green-tint"
    >
      <span className="theme-light-only items-center">
        <MoonIcon />
        <span className="sr-only">{t.nav.darkMode}</span>
      </span>
      <span className="theme-dark-only items-center">
        <SunIcon />
        <span className="sr-only">{t.nav.lightMode}</span>
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
