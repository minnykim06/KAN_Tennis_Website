"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/client";

export function LangToggle() {
  const { lang, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t.nav.switchLanguage}
      className={`flex rounded-full border border-green-line p-0.5 text-xs font-semibold ${pending ? "opacity-60" : ""}`}
    >
      {(["ko", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          aria-pressed={lang === code}
          onClick={() => lang !== code && startTransition(() => setLanguage(code))}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === code ? "bg-brand text-white" : "text-green hover:bg-green-tint"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
