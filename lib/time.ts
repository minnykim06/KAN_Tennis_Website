import { REGULAR_SCHEDULE, TIME_ZONE } from "./constants";
import type { Lang } from "./i18n";

// Game day dates/times are stored as Pacific wall-clock values ("2026-10-22",
// "19:00:00"). To format them without the server's own time zone leaking in,
// we treat them as UTC instants and format in UTC.

/** Today's date in San Diego, as YYYY-MM-DD. */
export function todayInPacific(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

/** The next regular game day (Tuesday) on or after `from` (YYYY-MM-DD). */
export function nextRegularDay(from: string = todayInPacific()): string {
  const date = parseDate(from);
  const isoDow = date.getUTCDay() || 7; // Mon=1 … Sun=7
  const days = (REGULAR_SCHEDULE.weekday - isoDow + 7) % 7;
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

const locale = (lang: Lang) => (lang === "ko" ? "ko-KR" : "en-US");

/** "10월 22일 (목)" / "Thu, Oct 22" — adds the year when it isn't this year. */
export function formatDate(date: string, lang: Lang, opts: { long?: boolean } = {}): string {
  const d = parseDate(date);
  const thisYear = todayInPacific().slice(0, 4) === date.slice(0, 4);
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "UTC",
    weekday: opts.long ? "long" : "short",
    month: opts.long ? "long" : "short",
    day: "numeric",
    year: thisYear ? undefined : "numeric",
  }).format(d);
}

/** "오후 7:00" / "7:00 PM" */
export function formatTime(time: string, lang: Lang): string {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export function formatTimeRange(start: string, end: string, lang: Lang): string {
  return `${formatTime(start, lang)} – ${formatTime(end, lang)}`;
}
