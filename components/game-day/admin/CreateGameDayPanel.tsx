"use client";

import { useState } from "react";
import { createNextRegularGameDay } from "@/app/actions/game-day";
import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { button } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import { GameDayForm, type GameDayValues } from "./GameDayForm";
import { useFormAction } from "./useFormAction";

/**
 * Moderator panel at the top of Game Day: a one-click "next Thursday" button
 * and a full create form prefilled with the regular schedule.
 */
export function CreateGameDayPanel({ defaults, nextDateLabel }: { defaults: GameDayValues; nextDateLabel: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const quick = useFormAction(() => createNextRegularGameDay());

  return (
    <section className="mb-8 rounded-2xl border border-dashed border-green/40 bg-green-tint/30 p-4 sm:p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-green">{t.mod.tools}</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <form onSubmit={quick.onSubmit}>
          <button type="submit" disabled={quick.pending} className={`${button.primary} w-full flex-col !gap-0 sm:w-auto`}>
            <span className="flex items-center gap-2">
              {quick.pending ? <Spinner /> : "⚡"} {t.mod.createNextThursday}
            </span>
            <span className="text-xs font-normal opacity-80">{nextDateLabel} · {t.home.hours} · {t.gameDay.doubles}</span>
          </button>
        </form>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className={`${button.outline} w-full sm:w-auto`}>
            + {t.mod.createGameDay}
          </button>
        )}
      </div>
      {quick.state && !quick.state.ok && (
        <div className="mt-3">
          <FormError state={quick.state} />
        </div>
      )}
      {open && <GameDayForm values={defaults} onDone={() => setOpen(false)} />}
    </section>
  );
}
