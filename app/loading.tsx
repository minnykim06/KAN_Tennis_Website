"use client";

import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/lib/i18n/client";

export default function Loading() {
  const { t } = useI18n();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-muted">
      <Spinner className="size-5 text-green" />
      {t.common.loading}
    </div>
  );
}
