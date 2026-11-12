import type { TeamId } from "@/lib/tournament/fall-2026";

// Fixed colors, independent of light/night mode: 흑팀 is always the dark card,
// 백팀 always the light one. Both keep a visible border on either page color.
export const TEAM_CARD: Record<TeamId, { card: string; sub: string; row: string; num: string }> = {
  black: {
    card: "border-neutral-600 bg-neutral-950 text-white",
    sub: "text-neutral-300",
    row: "border-neutral-800",
    num: "border-neutral-600 text-neutral-300",
  },
  white: {
    card: "border-neutral-400 bg-white text-neutral-950",
    sub: "text-neutral-600",
    row: "border-neutral-200",
    num: "border-neutral-400 text-neutral-600",
  },
};
