import { Trophy } from "lucide-react";
import { PlayerSwatch } from "@/components/PlayerSwatch";
import { formatElapsed } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findPlayer, totalVp, type GameState } from "@/lib/game-state";

interface WinDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  onNewGame: () => void;
}

/** Shown when a player reaches 10 VP. Summary plus a new-game shortcut. */
export const WinDialog = ({ game, open, onClose, onNewGame }: WinDialogProps) => {
  const winner = game.winnerId ? findPlayer(game, game.winnerId) : undefined;
  if (!winner) return null;
  const duration = game.startedAt && game.finishedAt ? game.finishedAt - game.startedAt : 0;
  const standings = [...game.players].sort((a, b) => totalVp(game, b) - totalVp(game, a));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-accent/70">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent-foreground dark:text-accent" aria-hidden="true" />
            {winner.name} wins!
          </DialogTitle>
          <DialogDescription>
            {game.turnCount} turn{game.turnCount === 1 ? "" : "s"}
            {duration > 0 ? ` · ${formatElapsed(duration)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-1.5">
          {standings.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-right text-muted-foreground tabular-nums">{i + 1}.</span>
              <PlayerSwatch color={p.color} />
              <span className="flex-1 truncate font-semibold">{p.name}</span>
              <span className="font-bold tabular-nums">{totalVp(game, p)} VP</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onNewGame} size="lg" className="flex-1">
            New game, same players
          </Button>
          <Button onClick={onClose} variant="outline" size="lg" className="flex-1">
            Keep looking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
