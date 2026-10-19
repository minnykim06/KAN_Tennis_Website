"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import { button } from "./styles";
import { Spinner } from "./Spinner";

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  pending: pendingProp,
}: {
  children: ReactNode;
  variant?: keyof typeof button;
  className?: string;
  /** For forms submitted via onSubmit, which useFormStatus can't see. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  const { t } = useI18n();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${button[variant]} ${className}`}>
      {pending ? (
        <>
          <Spinner /> {t.common.saving}
        </>
      ) : (
        children
      )}
    </button>
  );
}
