"use client";

import { useState } from "react";
import {
  createTournamentMatch,
  deleteTournamentMatch,
  setTournamentInProgress,
  setTournamentResult,
  updateTournamentMatch,
} from "@/app/actions/tournament";
import { DeleteButton } from "@/components/game-day/admin/DeleteButton";
import { PlayerPicker } from "@/components/game-day/admin/PlayerPicker";
import { ResultForm } from "@/components/game-day/admin/ResultForm";
import { useFormAction } from "@/components/game-day/admin/useFormAction";
import { FormError } from "@/components/ui/FormError";
import { Spinner } from "@/components/ui/Spinner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import { PAIRS, PARTICIPANTS, TEAMS, getParticipant, partnerFor } from "@/lib/tournament/fall-2026";
import type { TournamentMatch, TournamentMatchKind } from "@/lib/tournament/types";
import type { MatchResult } from "@/lib/types";

// The same forms as game day (type-to-search players, score boxes, Team 1 /
// draw / Team 2), plus the match type. The page's .bw-theme makes them black and white.

const SLOTS = ["side1_a", "side1_b", "side2_a", "side2_b"] as const;
type Slot = (typeof SLOTS)[number];
const PARTNER: Record<Slot, Slot> = { side1_a: "side1_b", side1_b: "side1_a", side2_a: "side2_b", side2_b: "side2_a" };
const NO_BUSY = new Set<string>();

const RESULT: Record<string, MatchResult> = { side1: "player1_win", side2: "player2_win", draw: "draw" };

/** "+ Add match" button that opens the form below the match list, starting on the open tab's type. */
export function AddTournamentMatch({ kind }: { kind: TournamentMatchKind }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${button.small} mt-3`}>
        + {t.mod.addMatch}
      </button>
    );
  }
  return (
    <TournamentMatchForm
      key={formKey}
      initialKind={kind}
      onDone={() => {
        setFormKey((k) => k + 1);
        setOpen(false);
      }}
    />
  );
}

/** "Enter result" for signed-in members, like game day's ScoreEntry. */
export function TournamentScoreEntry({ match }: { match: TournamentMatch }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { result, score, names } = resultProps(match);

  if (open) {
    return (
      <ResultForm
        match={{ id: match.id, result, score }}
        format="doubles"
        side1={names([match.side1_a, match.side1_b])}
        side2={names([match.side2_a, match.side2_b])}
        onDone={() => setOpen(false)}
        action={setTournamentResult}
      />
    );
  }
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(true)} className={button.small}>
        {result === "pending" ? t.mod.enterResult : t.mod.editResult}
      </button>
    </div>
  );
}

/** The stored result in the shape the game day ResultForm expects. */
function resultProps(match: TournamentMatch) {
  const result: MatchResult = match.status === "final" && match.winner ? RESULT[match.winner] : "pending";
  const score = match.score1 !== null && match.score2 !== null ? `${match.score1}-${match.score2}` : null;
  const names = (ids: string[]) => ids.map((id) => getParticipant(id)?.name ?? "?");
  return { result, score, names };
}

/** Result entry, edit and remove controls under one match, like game day. */
export function TournamentMatchAdmin({ match }: { match: TournamentMatch }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"idle" | "result" | "edit">("idle");
  const close = () => setMode("idle");
  const progress = useFormAction(setTournamentInProgress);

  const { result, score, names } = resultProps(match);

  if (mode === "result") {
    return (
      <ResultForm
        match={{ id: match.id, result, score }}
        format="doubles"
        side1={names([match.side1_a, match.side1_b])}
        side2={names([match.side2_a, match.side2_b])}
        onDone={close}
        action={setTournamentResult}
      />
    );
  }
  if (mode === "edit" && match.kind !== "special") return <TournamentMatchForm match={match} onDone={close} />;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={() => setMode("result")} className={button.small}>
        {result === "pending" ? t.mod.enterResult : t.mod.editResult}
      </button>
      {match.status !== "final" && (
        <button
          type="button"
          disabled={progress.pending}
          onClick={() => {
            const formData = new FormData();
            formData.set("id", match.id);
            formData.set("in_progress", String(match.status !== "in_progress"));
            progress.run(formData);
          }}
          className={button.small}
        >
          {progress.pending && <Spinner className="size-3" />}
          {match.status === "in_progress" ? t.tournament.markScheduled : t.tournament.markInProgress}
        </button>
      )}
      {/* 스페셜 페어 matchups are set: results only, no editing or deleting. */}
      {match.kind !== "special" && (
        <>
          <button type="button" onClick={() => setMode("edit")} className={button.small}>
            {t.mod.editMatch}
          </button>
          <DeleteButton
            action={deleteTournamentMatch}
            id={match.id}
            label={t.mod.deleteMatch}
            confirmText={t.mod.confirmDeleteMatch}
            variant="smallDanger"
          />
        </>
      )}
      {progress.state && !progress.state.ok && (
        <div className="basis-full">
          <FormError state={progress.state} />
        </div>
      )}
    </div>
  );
}

function TournamentMatchForm({
  match,
  initialKind = "pair",
  onDone,
}: {
  match?: TournamentMatch;
  initialKind?: TournamentMatchKind;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { state, pending, onSubmit } = useFormAction(match ? updateTournamentMatch : createTournamentMatch, onDone);
  const kind: TournamentMatchKind = match?.kind ?? initialKind;
  const [picked, setPicked] = useState<Record<Slot, string>>({
    side1_a: match?.side1_a ?? "",
    side1_b: match?.side1_b ?? "",
    side2_a: match?.side2_a ?? "",
    side2_b: match?.side2_b ?? "",
  });
  // Bumped when a slot is filled in for the moderator, so that picker shows the new name.
  const [filled, setFilled] = useState<Record<Slot, number>>({ side1_a: 0, side1_b: 0, side2_a: 0, side2_b: 0 });
  const [time, setTime] = useState(match?.start_time?.slice(0, 5) ?? "");
  const [court, setCourt] = useState(match?.court ?? "");

  const chosen = SLOTS.map((s) => picked[s]).filter(Boolean);
  const idBase = `tm-${match?.id ?? "new"}`;

  function pick(slot: Slot, id: string) {
    const next = { ...picked, [slot]: id };
    // Picking one player fills in their partner for this match type.
    const partner = partnerFor(kind, id);
    const other = PARTNER[slot];
    if (partner && next[other] !== partner && !chosen.includes(partner)) {
      next[other] = partner;
      setFilled((f) => ({ ...f, [other]: f[other] + 1 }));
    }
    setPicked(next);
  }

  // 고정 페어: one pick per side, a whole pair, grouped by team. The two members
  // fill that side's slots; a pair already on the other side is greyed out.
  const pairOf = (side: 1 | 2): string => {
    const a = getParticipant(picked[side === 1 ? "side1_a" : "side2_a"]);
    const b = getParticipant(picked[side === 1 ? "side1_b" : "side2_b"]);
    return a && b && a.pairId === b.pairId ? a.pairId : "";
  };
  function pickPair(side: 1 | 2, pairId: string) {
    const pair = PAIRS.find((p) => p.id === pairId);
    const [a, b] = side === 1 ? (["side1_a", "side1_b"] as const) : (["side2_a", "side2_b"] as const);
    setPicked((prev) => ({ ...prev, [a]: pair?.members[0].id ?? "", [b]: pair?.members[1].id ?? "" }));
  }
  const pairSelect = (side: 1 | 2) => {
    const other = pairOf(side === 1 ? 2 : 1);
    return (
      <div>
        <label htmlFor={`${idBase}-pair${side}`} className={label}>
          {side === 1 ? t.mod.team1 : t.mod.team2}
        </label>
        <select
          id={`${idBase}-pair${side}`}
          value={pairOf(side)}
          onChange={(e) => pickPair(side, e.target.value)}
          required
          autoFocus={!match && side === 1}
          className={input}
        >
          <option value="">{t.tournament.selectPair}</option>
          {TEAMS.map((team) => (
            <optgroup key={team.id} label={team.id === "black" ? t.tournament.teamBlack : t.tournament.teamWhite}>
              {team.pairs.map((p, i) => (
                <option key={p.id} value={p.id} disabled={p.id === other}>
                  {String.fromCharCode(65 + i)} · {p.members[0].name} / {p.members[1].name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    );
  };

  const select = (slot: Slot, text: string) => (
    <PlayerPicker
      key={`${slot}-${kind}-${filled[slot]}`}
      id={`${idBase}-${slot}`}
      name={slot}
      label={text}
      players={PARTICIPANTS}
      value={picked[slot]}
      onChange={(id) => pick(slot, id)}
      taken={chosen.filter((id) => id !== picked[slot])}
      busy={NO_BUSY}
      autoFocus={!match && slot === "side1_a" && filled[slot] === 0}
    />
  );

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-green-line bg-surface p-3 sm:p-4">
      {match && <input type="hidden" name="id" value={match.id} />}

      {/* Only 고정 페어 can be added or edited; 스페셜 페어 matchups are set. */}
      <input type="hidden" name="kind" value={kind} />

      {kind === "pair" ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          {/* The pair selects aren't form fields themselves: submit the four player ids. */}
          {SLOTS.map((slot) => (
            <input key={slot} type="hidden" name={slot} value={picked[slot]} />
          ))}
          {pairSelect(1)}
          <span className="text-center text-xs uppercase text-muted sm:pb-3">{t.common.vs}</span>
          {pairSelect(2)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <fieldset className="space-y-2 rounded-lg bg-surface/70 p-2.5">
            <legend className="px-1 text-xs font-semibold text-green">{t.mod.team1}</legend>
            {select("side1_a", `${t.mod.team1} · 1`)}
            {select("side1_b", `${t.mod.team1} · 2`)}
          </fieldset>
          <span className="text-center text-xs uppercase text-muted">{t.common.vs}</span>
          <fieldset className="space-y-2 rounded-lg bg-surface/70 p-2.5">
            <legend className="px-1 text-xs font-semibold text-green">{t.mod.team2}</legend>
            {select("side2_a", `${t.mod.team2} · 1`)}
            {select("side2_b", `${t.mod.team2} · 2`)}
          </fieldset>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <div>
          <label htmlFor={`${idBase}-time`} className={label}>{t.tournament.startTime}</label>
          <input id={`${idBase}-time`} type="time" name="start_time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor={`${idBase}-court`} className={label}>{t.mod.court}</label>
          <input id={`${idBase}-court`} name="court" maxLength={20} value={court} onChange={(e) => setCourt(e.target.value)} className={input} />
        </div>
      </div>

      <FormError state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{match ? t.common.save : t.mod.addMatch}</SubmitButton>
        <button type="button" onClick={onDone} className={button.ghost}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
