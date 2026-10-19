"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionResult } from "@/lib/types";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * Runs a server action from a form's onSubmit and calls `onSuccess` each time
 * it succeeds. Submitting via onSubmit (instead of `action=`) skips React's
 * automatic form reset, so a validation error doesn't wipe what was typed.
 */
export function useFormAction(action: Action, onSuccess?: () => void) {
  const [state, dispatch, pending] = useActionState(action, null);
  const callback = useRef(onSuccess);

  useEffect(() => {
    callback.current = onSuccess;
  });

  useEffect(() => {
    if (state?.ok) callback.current?.();
  }, [state]);

  function run(formData: FormData) {
    startTransition(() => dispatch(formData));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    run(new FormData(e.currentTarget));
  }

  return { state, pending, onSubmit, run };
}
