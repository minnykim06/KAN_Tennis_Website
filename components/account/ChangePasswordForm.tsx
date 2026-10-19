"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/account";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, label } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";

const passwordProps = {
  type: "password",
  maxLength: 64,
  required: true,
  autoCapitalize: "none",
  autoCorrect: "off",
} as const;

/**
 * Submitted with `action=`, so React clears the fields after every attempt,
 * which is what we want for passwords.
 */
export function ChangePasswordForm() {
  const { t } = useI18n();
  const [state, action] = useActionState(changePassword, null);

  const fields = [
    { name: "currentPassword", text: t.account.currentPassword, autoComplete: "current-password", minLength: 1 },
    { name: "newPassword", text: t.account.newPassword, autoComplete: "new-password", minLength: 4 },
    { name: "newPasswordConfirm", text: t.account.newPasswordConfirm, autoComplete: "new-password", minLength: 4 },
  ];

  return (
    <form action={action} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`account-${f.name}`} className={label}>
            {f.text}
          </label>
          <input
            id={`account-${f.name}`}
            name={f.name}
            autoComplete={f.autoComplete}
            minLength={f.minLength}
            {...passwordProps}
            className={input}
          />
        </div>
      ))}

      <FormError state={state} />
      {state?.ok && (
        <p role="status" className="rounded-lg bg-green-tint px-3 py-2 text-sm text-green">
          {t.account.success}
        </p>
      )}

      <SubmitButton className="w-full sm:w-auto">{t.account.submit}</SubmitButton>
    </form>
  );
}
