"use client";

import { useI18n } from "@/lib/i18n/client";
import type { ActionResult } from "@/lib/types";

/** Shows the translated error from a server action result, if any. */
export function FormError({ state }: { state: ActionResult | null }) {
  const { t } = useI18n();
  if (!state || state.ok) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
      {t.errors[state.error]}
    </p>
  );
}
