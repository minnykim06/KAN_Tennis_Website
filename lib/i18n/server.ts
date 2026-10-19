import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, getDictionary, isLang, type Lang } from "./index";

export const getLang = cache(async (): Promise<Lang> => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
});

export async function getI18n() {
  const lang = await getLang();
  return { lang, t: getDictionary(lang) };
}
