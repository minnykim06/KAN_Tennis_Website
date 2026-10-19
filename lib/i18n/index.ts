import { ko } from "./ko";
import { en } from "./en";

/** Same shape as the Korean dictionary, with every leaf widened to string. */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type Dictionary = Widen<typeof ko>;
export type Lang = "ko" | "en";
export type ErrorKey = keyof Dictionary["errors"];

export const LANG_COOKIE = "lang";
export const DEFAULT_LANG: Lang = "ko";

const dictionaries: Record<Lang, Dictionary> = { ko, en };

export function isLang(value: unknown): value is Lang {
  return value === "ko" || value === "en";
}

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function isErrorKey(value: unknown): value is ErrorKey {
  return typeof value === "string" && value in ko.errors;
}

/** Replace {placeholders}: fmt("Hi, {name}", { name: "Min" }) → "Hi, Min" */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
