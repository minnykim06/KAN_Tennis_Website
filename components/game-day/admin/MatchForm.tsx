"use client";

import { useState } from "react";
import { createMatch, updateMatch } from "@/app/actions/game-day";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { matchPlayers, type GameFormat, type Match, type Player } from "@/lib/types";
import { useFormAction } from "./useFormAction";

type Slot = "player1_id" | "partner1_id" | "player2_id" | "partner2_id";

/** Add a matchup to a game day, or edit an existing one (when `match` is given). */
export function MatchForm({
  gameDayId,
  format,
  match,
  players,
  dayMatches,
  onDone,
}: {
  gameDayId: string;
  format: GameFormat;
  match?: Match;
  players: Player[];
  dayMatches: Match[];
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { state, pending, onSubmit } = useFormAction(match ? updateMatch : createMatch, onDone);
  const doubles = format === "doubles";
  const [picked, setPicked] = useState<Record<Slot, string>>({
    player1_id: match?.player1_id ?? "",
    partner1_id: match?.partner1_id ?? "",
    player2_id: match?.player2_id ?? "",
    partner2_id: match?.partner2_id ?? "",
  });
  const [court, setCourt] = useState(match?.court ?? "");
  const [note, setNote] = useState(match?.note ?? "");

  const slots: Slot[] = doubles ? ["player1_id", "partner1_id", "player2_id", "partner2_id"] : ["player1_id", "player2_id"];
  const chosen = slots.map((s) => picked[s]).filter(Boolean);

  // Players already in another match that day → warn, but allow.
  const busy = new Set(dayMatches.filter((m) => m.id !== match?.id).flatMap(matchPlayers));
  const busyNames = chosen.filter((id) => busy.has(id)).map((id) => players.find((p) => p.id === id)?.name);

  const idBase = `mf-${match?.id ?? gameDayId}`;
  const select = (slot: Slot, text: string) => (
    <div key={slot}>
      <label htmlFor={`${idBase}-${slot}`} className={label}>{text}</label>
      <select
        id={`${idBase}-${slot}`}
        name={slot}
        required
        value={picked[slot]}
        onChange={(e) => setPicked({ ...picked, [slot]: e.target.value })}
        className={input}
      >
        <option value="" disabled>
          {t.mod.selectPlayer}
        </option>
        {players.map((p) => (
          // A player already chosen in another slot can't be picked again.
          <option key={p.id} value={p.id} disabled={p.id !== picked[slot] && chosen.includes(p.id)}>
            {p.name}
            {busy.has(p.id) ? " •" : ""}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-green-line bg-green-tint/40 p-3 sm:p-4">
      {match ? <input type="hidden" name="id" value={match.id} /> : <input type="hidden" name="game_day_id" value={gameDayId} />}

      {doubles ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <fieldset className="space-y-2 rounded-lg bg-surface/70 p-2.5">
            <legend className="px-1 text-xs font-semibold text-green">{t.mod.team1}</legend>
            {select("player1_id", `${t.mod.team1} · 1`)}
            {select("partner1_id", `${t.mod.team1} · 2`)}
          </fieldset>
          <span className="text-center text-xs uppercase text-muted">{t.common.vs}</span>
          <fieldset className="space-y-2 rounded-lg bg-surface/70 p-2.5">
            <legend className="px-1 text-xs font-semibold text-green">{t.mod.team2}</legend>
            {select("player2_id", `${t.mod.team2} · 1`)}
            {select("partner2_id", `${t.mod.team2} · 2`)}
          </fieldset>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {select("player1_id", t.mod.player1)}
          {select("player2_id", t.mod.player2)}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor={`${idBase}-court`} className={label}>{t.mod.court}</label>
          <input id={`${idBase}-court`} name="court" maxLength={20} value={court} onChange={(e) => setCourt(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor={`${idBase}-note`} className={label}>{t.mod.matchNote}</label>
          <input id={`${idBase}-note`} name="note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        </div>
      </div>

      {busyNames.length > 0 && (
        <p role="status" className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
          ⚠️ {fmt(t.mod.alreadyPlaying, { names: busyNames.join(", ") })}
        </p>
      )}
      <FormError state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{match ? t.common.save : t.mod.addMatch}</SubmitButton>
        <button type="button" onClick={onDone} className={button.ghost}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
