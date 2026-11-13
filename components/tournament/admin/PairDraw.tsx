"use client";

import { useState } from "react";
import { resetPairDraw, savePairDraw } from "@/app/actions/tournament";
import { useFormAction } from "@/components/game-day/admin/useFormAction";
import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import { LETTERS, TEAMS, type Letter, type PairDraw as Draw, type TeamId } from "@/lib/tournament/fall-2026";

const EMPTY: Record<TeamId, Record<Letter, string>> = {
  black: { A: "", B: "", C: "", D: "", E: "" },
  white: { A: "", B: "", C: "", D: "", E: "" },
};

/**
 * Moderator-only: enter the 제비뽑기 (which pair drew which letter, per team).
 * Saving creates or updates the 15 scheduled 고정 페어 matches.
 */
export function PairDraw({ draw, canDraw }: { draw: Draw | null; canDraw: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!canDraw) {
    return <p className="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{t.tournament.drawNotReady}</p>;
  }
  if (!open) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setOpen(true)} className={button.small}>
          {draw ? t.tournament.drawEdit : `+ ${t.tournament.drawEnter}`}
        </button>
        {draw && <ResetDraw />}
      </div>
    );
  }
  return <DrawForm draw={draw} onDone={() => setOpen(false)} />;
}

/** Clear the draw and its 15 matches (refused once any of them has started). */
function ResetDraw() {
  const { t } = useI18n();
  const { state, pending, run } = useFormAction(resetPairDraw);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t.tournament.drawResetConfirm)) run(new FormData());
        }}
        className={button.smallDanger}
      >
        {pending && <Spinner className="size-3" />}
        {t.tournament.drawReset}
      </button>
      {state && !state.ok && (
        <div className="basis-full">
          <FormError state={state} />
        </div>
      )}
    </>
  );
}

function DrawForm({ draw, onDone }: { draw: Draw | null; onDone: () => void }) {
  const { t } = useI18n();
  const { state, pending, onSubmit } = useFormAction(savePairDraw, onDone);
  const [picked, setPicked] = useState<Record<TeamId, Record<Letter, string>>>(draw ?? EMPTY);

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-green-line bg-surface p-3 sm:p-4">
      <div>
        <p className="text-sm font-semibold text-ink">{t.tournament.drawTitle}</p>
        <p className="mt-0.5 text-xs text-muted">{t.tournament.drawHint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEAMS.map((team) => {
          const used = Object.values(picked[team.id]);
          return (
            <fieldset key={team.id} className="space-y-2">
              <legend className={label}>{team.id === "black" ? t.tournament.teamBlack : t.tournament.teamWhite}</legend>
              {LETTERS.map((letter) => {
                const id = `draw-${team.id}-${letter}`;
                return (
                  <div key={letter} className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2">
                    <label
                      htmlFor={id}
                      className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                        team.id === "black" ? "bg-neutral-950 text-white" : "border-2 border-neutral-950 bg-white text-neutral-950"
                      }`}
                    >
                      {letter}
                    </label>
                    <select
                      id={id}
                      name={`${team.id}_${letter}`}
                      value={picked[team.id][letter]}
                      onChange={(e) =>
                        setPicked((prev) => ({ ...prev, [team.id]: { ...prev[team.id], [letter]: e.target.value } }))
                      }
                      required
                      className={`${input} min-w-0`}
                    >
                      <option value="">{t.tournament.selectPair}</option>
                      {team.pairs.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.id !== picked[team.id][letter] && used.includes(p.id)}>
                          {p.members[0].name} / {p.members[1].name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </fieldset>
          );
        })}
      </div>

      <FormError state={state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{t.tournament.drawSave}</SubmitButton>
        <button type="button" onClick={onDone} className={button.ghost}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
