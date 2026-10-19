"use client";

import { useActionState, useEffect, useState } from "react";
import { register, signIn } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, label } from "@/components/ui/styles";

const passwordProps = {
  type: "password",
  minLength: 4,
  maxLength: 64,
  required: true,
  autoCapitalize: "none",
  autoCorrect: "off",
} as const;

export function AuthForm({ mode, onSuccess }: { mode: "signIn" | "register"; onSuccess: () => void }) {
  const { t } = useI18n();
  const [state, action] = useActionState(mode === "signIn" ? signIn : register, null);
  // Controlled so the name survives React's form reset after a failed attempt.
  const [name, setName] = useState("");

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      {mode === "register" && <p className="text-sm text-muted">{t.auth.registerHint}</p>}

      <div>
        <label htmlFor="auth-name" className={label}>
          {t.auth.name}
        </label>
        <input
          id="auth-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          autoComplete="username"
          placeholder={t.auth.namePlaceholder}
          className={input}
        />
      </div>

      <div>
        <label htmlFor="auth-password" className={label}>
          {t.auth.password}
        </label>
        <input
          id="auth-password"
          name="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          {...passwordProps}
          className={input}
        />
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="auth-password-confirm" className={label}>
            {t.auth.passwordConfirm}
          </label>
          <input
            id="auth-password-confirm"
            name="passwordConfirm"
            autoComplete="new-password"
            {...passwordProps}
            className={input}
          />
        </div>
      )}

      <FormError state={state} />

      <SubmitButton className="w-full">{mode === "signIn" ? t.auth.signIn : t.auth.register}</SubmitButton>
    </form>
  );
}
