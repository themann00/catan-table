import { PlayerSwatch } from "@/components/PlayerSwatch";
import { formatElapsed } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameSummary } from "@/lib/game-state";

interface GameHistoryProps {
  history: GameSummary[];
}

const dateLabel = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
  " " +
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** Last ten finished games. */
export const GameHistory = ({ history }: GameHistoryProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">Last {history.length} game{history.length === 1 ? "" : "s"}</CardTitle>
    </CardHeader>
    <CardContent>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Finished games land here.</p>
      ) : (
        <ol className="divide-y divide-border/60">
          {history.map((g) => (
            <li key={g.id} className="py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{g.winnerName} won</span>
                <span className="text-xs text-muted-foreground">
                  {dateLabel(g.finishedAt)} · {g.turns} turns{g.durationMs > 0 ? ` · ${formatElapsed(g.durationMs)}` : ""}
                </span>
              </div>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {g.players.map((p, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <PlayerSwatch color={p.color} className="h-3.5 w-3.5" />
                    {p.name} {p.vp}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </CardContent>
  </Card>
);
