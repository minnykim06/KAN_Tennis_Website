"use client";

import { useState } from "react";
import { deleteMatch } from "@/app/actions/game-day";
import { button } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import { team1, team2, type GameFormat, type Match, type Player } from "@/lib/types";
import { DeleteButton } from "./DeleteButton";
import { MatchForm } from "./MatchForm";
import { ResultForm } from "./ResultForm";

/** Result entry, edit and remove controls under one matchup. */
export function MatchAdmin({
  match,
  format,
  players,
  dayMatches,
}: {
  match: Match;
  format: GameFormat;
  players: Player[];
  dayMatches: Match[];
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"idle" | "result" | "edit">("idle");
  const close = () => setMode("idle");
  const names = (ids: string[]) => ids.map((id) => players.find((p) => p.id === id)?.name ?? "?");

  if (mode === "result") {
    return <ResultForm match={match} format={format} side1={names(team1(match))} side2={names(team2(match))} onDone={close} />;
  }
  if (mode === "edit") {
    return (
      <MatchForm
        gameDayId={match.game_day_id}
        format={format}
        match={match}
        players={players}
        dayMatches={dayMatches}
        onDone={close}
      />
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={() => setMode("result")} className={button.small}>
        {match.result === "pending" ? t.mod.enterResult : t.mod.editResult}
      </button>
      <button type="button" onClick={() => setMode("edit")} className={button.small}>
        {t.mod.editMatch}
      </button>
      <DeleteButton action={deleteMatch} id={match.id} label={t.mod.deleteMatch} confirmText={t.mod.confirmDeleteMatch} variant="smallDanger" />
    </div>
  );
}
