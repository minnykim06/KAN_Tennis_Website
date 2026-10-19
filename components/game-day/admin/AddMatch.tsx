"use client";

import { useState } from "react";
import { button } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import type { GameFormat, Match, Player } from "@/lib/types";
import { MatchForm } from "./MatchForm";

export function AddMatch({
  gameDayId,
  format,
  players,
  dayMatches,
}: {
  gameDayId: string;
  format: GameFormat;
  players: Player[];
  dayMatches: Match[];
}) {
  const { t } = useI18n();
  // Bumping the key resets the form so several matchups can be added in a row.
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${button.small} mt-3`}>
        + {t.mod.addMatch}
      </button>
    );
  }

  return (
    <MatchForm
      key={formKey}
      gameDayId={gameDayId}
      format={format}
      players={players}
      dayMatches={dayMatches}
      onDone={() => {
        setFormKey((k) => k + 1);
        setOpen(false);
      }}
    />
  );
}
