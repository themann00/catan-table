import { cn } from "@/lib/utils";
import type { RollEntry } from "@/lib/roll-state";

interface RollLogProps {
  rolls: RollEntry[];
  /** Player names, indexed like RollEntry.playerIndex. */
  playerNames?: string[];
}

const totalClass = (total: number) =>
  total === 7
    ? "bg-destructive text-destructive-foreground"
    : total === 6 || total === 8
      ? "bg-hills text-white"
      : "bg-muted text-foreground";

/** Newest first. Chips show the total; the title carries the dice. */
export const RollLog = ({ rolls, playerNames }: RollLogProps) => {
  if (rolls.length === 0) {
    return <p className="text-sm text-muted-foreground">No rolls yet.</p>;
  }
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Recent rolls, newest first">
      {rolls.map((r, i) => {
        const who = r.playerIndex !== undefined ? playerNames?.[r.playerIndex] : undefined;
        return (
          <li
            key={r.id}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-bold tabular-nums",
              totalClass(r.total),
              i === 0 && "ring-2 ring-ring ring-offset-1 ring-offset-background",
            )}
            title={`Roll ${r.id}: ${r.red} + ${r.yellow}${who ? ` by ${who}` : ""}`}
            aria-label={`Roll ${r.id}: ${r.total}, red ${r.red} yellow ${r.yellow}${who ? `, ${who}` : ""}`}
          >
            {r.total}
          </li>
        );
      })}
    </ol>
  );
};
