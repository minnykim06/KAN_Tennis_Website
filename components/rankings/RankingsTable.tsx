import type { Standing } from "@/lib/ranking";
import type { Dictionary } from "@/lib/i18n";

// Subtle accents for the podium: a colored bar on the rank cell + tinted medal.
const PODIUM: Record<number, { bar: string; medal: string }> = {
  1: { bar: "before:bg-gold", medal: "bg-gold/15 text-gold-ink ring-gold/40" },
  2: { bar: "before:bg-silver", medal: "bg-silver/15 text-silver-ink ring-silver/50" },
  3: { bar: "before:bg-bronze", medal: "bg-bronze/15 text-bronze-ink ring-bronze/40" },
};

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

export function RankingsTable({
  standings,
  currentPlayerId,
  t,
}: {
  standings: Standing[];
  currentPlayerId?: string;
  t: Dictionary["rankings"];
}) {
  const num = "px-2 py-3 text-center tabular-nums";
  // Rank + player columns stay pinned while the stats scroll sideways on phones.
  const stickyRank = "sticky left-0 z-10 w-12 min-w-12";
  const stickyName = "sticky left-12 z-10 shadow-[1px_0_0_var(--color-green-line)] sm:shadow-none";

  return (
    <div className="overflow-x-auto rounded-2xl border border-green-line/70 bg-surface shadow-sm">
      <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-brand text-xs uppercase tracking-wide text-white">
            <th scope="col" className={`${stickyRank} bg-brand px-2 py-3 text-center font-medium`}>
              {t.rank}
            </th>
            <th scope="col" className={`${stickyName} bg-brand px-3 py-3 text-left font-medium`}>
              {t.player}
            </th>
            <th scope="col" className={`${num} font-medium`}>{t.played}</th>
            <th scope="col" className={`${num} font-medium`}>{t.wins}</th>
            <th scope="col" className={`${num} font-medium`}>{t.draws}</th>
            <th scope="col" className={`${num} font-medium`}>{t.losses}</th>
            <th scope="col" className={`${num} font-medium whitespace-nowrap`}>{t.gameDiff}</th>
            <th scope="col" className={`${num} pr-4 font-semibold`}>{t.points}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isMe = s.playerId === currentPlayerId;
            const podium = s.rank ? PODIUM[s.rank] : undefined;
            // Sticky cells need an opaque background matching the row.
            const rowBg = isMe ? "bg-me" : i % 2 === 1 ? "bg-green-tint" : "bg-surface";
            const idle = s.played === 0;

            return (
              <tr
                key={s.playerId}
                aria-current={isMe ? "true" : undefined}
                className={`${rowBg} ${idle ? "text-muted" : ""}`}
              >
                <td
                  className={`${stickyRank} ${rowBg} relative px-2 py-3 text-center ${
                    podium ? `before:absolute before:inset-y-0 before:left-0 before:w-1 ${podium.bar}` : ""
                  }`}
                >
                  {podium ? (
                    <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ring-1 ${podium.medal}`}>
                      {s.rank}
                    </span>
                  ) : (
                    <span className="tabular-nums">{s.rank ?? "–"}</span>
                  )}
                </td>
                <th scope="row" className={`${stickyName} ${rowBg} max-w-[7.5rem] px-3 py-3 text-left font-medium min-[400px]:max-w-[10rem] sm:max-w-none`}>
                  <span className="flex items-center gap-2">
                    <span className="truncate">{s.name}</span>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        {t.you}
                      </span>
                    )}
                  </span>
                </th>
                <td className={num}>{s.played}</td>
                <td className={num}>{s.wins}</td>
                <td className={num}>{s.draws}</td>
                <td className={num}>{s.losses}</td>
                <td
                  title={`${s.gamesWon}–${s.gamesLost}`}
                  className={`${num} ${s.gameDiff > 0 ? "text-green" : s.gameDiff < 0 ? "text-danger" : ""}`}
                >
                  {signed(s.gameDiff)}
                </td>
                <td className={`${num} pr-4 text-base font-semibold ${idle ? "" : "text-green"}`}>{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
