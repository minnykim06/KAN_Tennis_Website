"use client";

import { setTournamentEnded } from "@/app/actions/tournament";
import { useFormAction } from "@/components/game-day/admin/useFormAction";
import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/lib/i18n/client";

/** Moderator-only: end the tournament (results become final), or reopen it. */
export function EndTournament({ ended, canEnd }: { ended: boolean; canEnd: boolean }) {
  const { t } = useI18n();
  const { state, pending, onSubmit } = useFormAction(setTournamentEnded);

  if (!canEnd) {
    return <p className="mb-6 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{t.tournament.endSetupNeeded}</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        if (ended || window.confirm(t.tournament.confirmEnd)) onSubmit(e);
        else e.preventDefault();
      }}
      className="mb-6 flex flex-wrap items-center justify-end gap-2"
    >
      <input type="hidden" name="ended" value={String(!ended)} />
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
          ended ? "border border-neutral-400 text-ink hover:bg-green-tint" : "bg-white text-neutral-950 hover:bg-neutral-200"
        }`}
      >
        {pending && <Spinner />}
        {ended ? t.tournament.reopenTournament : t.tournament.endTournament}
      </button>
      {state && !state.ok && (
        <div className="basis-full">
          <FormError state={state} />
        </div>
      )}
    </form>
  );
}
