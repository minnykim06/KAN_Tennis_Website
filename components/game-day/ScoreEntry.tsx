"use client";

import { useState } from "react";
import { button } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import type { GameFormat, Match } from "@/lib/types";
import { ResultForm } from "./admin/ResultForm";

/** "Enter result" for signed-in members, while the game day is open. */
export function ScoreEntry({
  match,
  format,
  side1,
  side2,
}: {
  match: Match;
  format: GameFormat;
  side1: string[];
  side2: string[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (open) {
    return <ResultForm match={match} format={format} side1={side1} side2={side2} onDone={() => setOpen(false)} />;
  }
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(true)} className={button.small}>
        {match.result === "pending" ? t.mod.enterResult : t.mod.editResult}
      </button>
    </div>
  );
}
