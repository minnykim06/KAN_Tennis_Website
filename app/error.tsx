"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import { button } from "@/components/ui/styles";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-green">{t.common.errorTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.errors.generic}</p>
      <button type="button" onClick={() => retry()} className={`${button.primary} mt-6`}>
        {t.common.retry}
      </button>
    </div>
  );
}
