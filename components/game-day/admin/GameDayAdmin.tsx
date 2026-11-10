"use client";

import { useState } from "react";
import { deleteGameDay, setGameDayClosed } from "@/app/actions/game-day";
import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { button } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import type { GameDay } from "@/lib/types";
import { DeleteButton } from "./DeleteButton";
import { GameDayForm } from "./GameDayForm";
import { useFormAction } from "./useFormAction";

/** Close / edit / delete controls for one game day. */
export function GameDayAdmin({ gameDay }: { gameDay: GameDay }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const closing = useFormAction(setGameDayClosed);

  if (editing) {
    return (
      <GameDayForm
        id={gameDay.id}
        values={{
          date: gameDay.date,
          start_time: gameDay.start_time.slice(0, 5),
          end_time: gameDay.end_time.slice(0, 5),
          location: gameDay.location,
          notes: gameDay.notes,
          format: gameDay.format,
        }}
        formatLocked={gameDay.matches.length > 0}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 border-b border-dashed border-green-line pb-2">
      <span className="mr-auto text-[10px] font-semibold uppercase tracking-wider text-muted">{t.mod.tools}</span>
      <form onSubmit={closing.onSubmit} className="contents">
        <input type="hidden" name="id" value={gameDay.id} />
        <input type="hidden" name="closed" value={gameDay.closed ? "false" : "true"} />
        <button type="submit" disabled={closing.pending} className={button.ghost}>
          {closing.pending && <Spinner className="size-3" />}
          {gameDay.closed ? `🔓 ${t.mod.reopenGameDay}` : `🔒 ${t.mod.closeGameDay}`}
        </button>
      </form>
      <button type="button" onClick={() => setEditing(true)} className={button.ghost}>
        {t.mod.editGameDay}
      </button>
      <DeleteButton
        action={deleteGameDay}
        id={gameDay.id}
        label={t.mod.deleteGameDay}
        confirmText={t.mod.confirmDeleteGameDay}
      />
      {closing.state && !closing.state.ok && (
        <div className="basis-full">
          <FormError state={closing.state} />
        </div>
      )}
    </div>
  );
}
