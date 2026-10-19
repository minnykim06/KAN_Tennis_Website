"use client";

import { createContext, use, type ReactNode } from "react";
import { getDictionary, type Dictionary, type Lang } from "./index";

const I18nContext = createContext<{ lang: Lang; t: Dictionary } | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <I18nContext value={{ lang, t: getDictionary(lang) }}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = use(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
