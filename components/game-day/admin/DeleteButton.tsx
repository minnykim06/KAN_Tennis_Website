"use client";

import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { button } from "@/components/ui/styles";
import type { ActionResult } from "@/lib/types";
import { useFormAction } from "./useFormAction";

export function DeleteButton({
  action,
  id,
  label,
  confirmText,
  variant = "danger",
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  id: string;
  label: string;
  confirmText: string;
  variant?: "danger" | "smallDanger";
}) {
  const { state, pending, onSubmit } = useFormAction(action);

  return (
    <form
      onSubmit={(e) => {
        if (window.confirm(confirmText)) onSubmit(e);
        else e.preventDefault();
      }}
      className="contents"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={button[variant]}>
        {pending && <Spinner className="size-3" />}
        {label}
      </button>
      {state && !state.ok && (
        <div className="basis-full">
          <FormError state={state} />
        </div>
      )}
    </form>
  );
}
