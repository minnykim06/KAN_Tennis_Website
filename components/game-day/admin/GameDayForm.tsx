"use client";

import { createGameDay, updateGameDay } from "@/app/actions/game-day";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import type { GameFormat } from "@/lib/types";
import { useFormAction } from "./useFormAction";

export type GameDayValues = {
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes?: string | null;
  format: GameFormat;
};

/** Create (no id) or edit (with id) a game day. */
export function GameDayForm({
  id,
  values,
  formatLocked = false,
  onDone,
}: {
  id?: string;
  values: GameDayValues;
  /** True when the game day has matchups, so singles/doubles can't change. */
  formatLocked?: boolean;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { state, pending, onSubmit } = useFormAction(id ? updateGameDay : createGameDay, onDone);
  const field = (name: Exclude<keyof GameDayValues, "format">) => ({ id: `gd-${id ?? "new"}-${name}`, name, defaultValue: values[name] ?? "" });

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-xl border border-green-line bg-green-tint/40 p-4 sm:grid-cols-3">
      {id && <input type="hidden" name="id" value={id} />}

      <fieldset className="sm:col-span-3">
        <legend className={label}>{t.mod.format}</legend>
        <div className="grid grid-cols-2 gap-1.5 sm:max-w-xs">
          {(["doubles", "singles"] as const).map((f) => {
            const disabled = formatLocked && f !== values.format;
            return (
              <label
                key={f}
                className={`relative flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors has-[:checked]:border-green has-[:checked]:bg-brand has-[:checked]:text-white ${
                  disabled ? "cursor-not-allowed opacity-40" : "border-green-line bg-surface text-ink hover:bg-green-tint"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f}
                  defaultChecked={values.format === f}
                  disabled={disabled}
                  className="sr-only"
                />
                {f === "doubles" ? t.gameDay.doubles : t.gameDay.singles}
              </label>
            );
          })}
        </div>
        {formatLocked && <p className="mt-1 text-xs text-muted">{t.errors.formatLocked}</p>}
      </fieldset>

      <div className="sm:col-span-1">
        <label htmlFor={field("date").id} className={label}>{t.mod.date}</label>
        <input type="date" required className={input} {...field("date")} />
      </div>
      <div>
        <label htmlFor={field("start_time").id} className={label}>{t.mod.startTime}</label>
        <input type="time" required step={300} className={input} {...field("start_time")} />
      </div>
      <div>
        <label htmlFor={field("end_time").id} className={label}>{t.mod.endTime}</label>
        <input type="time" required step={300} className={input} {...field("end_time")} />
      </div>
      <div className="sm:col-span-3">
        <label htmlFor={field("location").id} className={label}>{t.mod.location}</label>
        <input required maxLength={100} className={input} {...field("location")} />
      </div>
      <div className="sm:col-span-3">
        <label htmlFor={field("notes").id} className={label}>{t.mod.notes}</label>
        <textarea rows={2} maxLength={500} className={input} {...field("notes")} />
      </div>

      <div className="sm:col-span-3">
        <FormError state={state} />
      </div>
      <div className="flex gap-2 sm:col-span-3">
        <SubmitButton pending={pending}>{id ? t.common.save : t.common.create}</SubmitButton>
        <button type="button" onClick={onDone} className={button.ghost}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
