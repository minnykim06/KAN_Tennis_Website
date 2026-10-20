"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/client";
import { AuthForm } from "./AuthForm";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      aria-labelledby="auth-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between">
          <h2 id="auth-title" className="font-serif text-2xl font-semibold text-green">
            {t.auth.signInTitle}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t.auth.close}
            className="-mr-2 -mt-1 rounded-full p-2 text-xl leading-none text-muted hover:bg-green-tint"
          >
            ×
          </button>
        </div>

        <AuthForm onSuccess={() => dialogRef.current?.close()} />

        <p className="mt-5 text-center text-sm text-muted">{t.auth.noAccount}</p>
      </div>
    </dialog>
  );
}
