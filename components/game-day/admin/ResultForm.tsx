"use client";

import { useState } from "react";
import { setMatchResult } from "@/app/actions/game-day";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { parseScore } from "@/lib/score";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import type { GameFormat, Match, MatchResult } from "@/lib/types";
import { useFormAction } from "./useFormAction";

export function ResultForm({
  match,
  format,
  side1,
  side2,
  onDone,
}: {
  match: Match;
  format: GameFormat;
  side1: string[];
  side2: string[];
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { state, pending, onSubmit, run } = useFormAction(setMatchResult, onDone);
  const [result, setResult] = useState<MatchResult>(match.result === "pending" ? "player1_win" : match.result);
  // Scores are stored as "6-0" (Team 1 first); older entries may have extra sets, so take the first.
  const firstSet = match.score ? parseScore(match.score)?.[0] : undefined;
  const [games, setGames] = useState<[string, string]>(firstSet ? [String(firstSet[0]), String(firstSet[1])] : ["", ""]);

  function setTeamGames(side: 0 | 1, raw: string) {
    const next: [string, string] = [...games];
    next[side] = raw.replace(/\D/g, "").slice(0, 2);
    setGames(next);
    // Once both are filled in, pick the matching result so the two never disagree.
    if (next[0] !== "" && next[1] !== "") {
      const [a, b] = next.map(Number);
      setResult(a > b ? "player1_win" : b > a ? "player2_win" : "draw");
    }
  }

  const sides = [side1, side2] as const;

  const options: { value: MatchResult; text: string; sub: string }[] = [
    { value: "player1_win", text: side1.join(" / "), sub: format === "doubles" ? t.mod.team1Win : t.mod.player1Win },
    { value: "draw", text: t.mod.draw, sub: "" },
    { value: "player2_win", text: side2.join(" / "), sub: format === "doubles" ? t.mod.team2Win : t.mod.player2Win },
  ];

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-green-line bg-surface p-3">
      <input type="hidden" name="id" value={match.id} />

      <fieldset>
        <legend className={label}>{t.mod.score}</legend>
        {/* Team 1 · vs · Team 2, each team's games right under its names. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          {sides.map((names, i) => (
            <div key={i} className={`flex flex-col items-center gap-1.5 ${i === 1 ? "col-start-3" : ""}`}>
              <div className="w-full text-center text-sm font-medium leading-snug text-ink">
                {names.map((n) => (
                  <p key={n} className="truncate">{n}</p>
                ))}
              </div>
              <input
                name={i === 0 ? "score1" : "score2"}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={2}
                value={games[i]}
                onChange={(e) => setTeamGames(i as 0 | 1, e.target.value)}
                placeholder="–"
                aria-label={fmt(t.mod.gamesFor, { team: names.join(" / ") })}
                className={`${input} max-w-20 text-center text-2xl font-semibold tabular-nums sm:text-2xl`}
              />
            </div>
          ))}
          <span className="col-start-2 row-start-1 self-end pb-3 text-xs font-medium uppercase text-muted">{t.common.vs}</span>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted">{t.mod.scoreHint}</p>
      </fieldset>

      <fieldset>
        <legend className={label}>{t.mod.result}</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {options.map((o) => (
            <label
              key={o.value}
              className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center text-sm transition-colors ${
                result === o.value ? "border-green bg-brand text-white" : "border-green-line text-ink hover:bg-green-tint"
              }`}
            >
              <input
                type="radio"
                name="result"
                value={o.value}
                checked={result === o.value}
                onChange={() => setResult(o.value)}
                className="sr-only"
              />
              <span className="w-full truncate font-medium">{o.text}</span>
              {o.sub && <span className="text-[10px] opacity-75">{o.sub}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <FormError state={state} />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
        {match.result !== "pending" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const formData = new FormData();
              formData.set("id", match.id);
              formData.set("result", "pending");
              run(formData);
            }}
            className={button.outline}
          >
            {t.mod.clearResult}
          </button>
        )}
        <button type="button" onClick={onDone} className={button.ghost}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
