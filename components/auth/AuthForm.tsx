"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, label } from "@/components/ui/styles";

/** Name + password sign-in. Accounts are created by moderators, not by players. */
export function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useI18n();
  const [state, action] = useActionState(signIn, null);
  // Controlled so the name survives React's form reset after a failed attempt.
  const [name, setName] = useState("");

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-4">
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
          type="password"
          minLength={4}
          maxLength={64}
          required
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="current-password"
          className={input}
        />
      </div>

      <FormError state={state} />

      <SubmitButton className="w-full">{t.auth.signIn}</SubmitButton>
    </form>
  );
}
