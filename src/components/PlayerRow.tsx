import { useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import { PlayerSwatch } from "@/components/PlayerSwatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicVp, totalVp, type GameAction, type GameState, type Player } from "@/lib/game-state";
import { PLAYER_COLOR_LABEL } from "@/lib/player-colors";
import { LARGEST_ARMY_VP, LONGEST_ROAD_VP, PLAYER_COLORS, WINNING_VP, type PlayerColor } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  game: GameState;
  player: Player;
  index: number;
  dispatch: (action: GameAction) => void;
  full: boolean;
  /** Drag reorder plumbing from the list. */
  onDragStart: (index: number) => void;
  onDropOn: (index: number) => void;
  dragging: boolean;
}

const now = () => Date.now();

/**
 * One player: color, name, VP stepper, the two special cards, and in Full
 * mode the hidden VP note. Setup shows reorder, remove, and starting player.
 */
export const PlayerRow = ({ game, player, index, dispatch, full, onDragStart, onDropOn, dragging }: PlayerRowProps) => {
  const setup = game.status === "setup";
  const playing = game.status === "playing";
  const isCurrent = playing && game.currentPlayerIndex === index;
  const isStarting = game.startingPlayerIndex === index;
  const isWinner = game.status === "finished" && game.winnerId === player.id;
  const total = totalVp(game, player);
  const shown = full ? total : publicVp(game, player);
  const hasRoad = game.longestRoadId === player.id;
  const hasArmy = game.largestArmyId === player.id;
  const [over, setOver] = useState(false);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setOver(true);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    onDropOn(index);
  };

  return (
    <li
      className={cn(
        "rounded-lg border bg-card/95 p-3 transition-colors",
        isCurrent ? "border-primary ring-2 ring-primary/40" : "border-border/60",
        isWinner && "border-accent ring-2 ring-accent/50",
        over && "border-dashed border-secondary",
        dragging && "opacity-50",
      )}
      onDragOver={setup ? onDragOver : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={setup ? onDrop : undefined}
      aria-current={isCurrent ? "true" : undefined}
    >
      <div className="flex items-center gap-2">
        {setup && (
          <button
            type="button"
            draggable
            onDragStart={() => onDragStart(index)}
            className="hidden h-11 w-8 shrink-0 cursor-grab items-center justify-center text-muted-foreground sm:flex"
            aria-label={`Drag to reorder ${player.name}`}
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        <label className="relative shrink-0">
          <span className="sr-only">Color for {player.name}</span>
          <PlayerSwatch color={player.color} className="h-11 w-11 text-sm">
            {isCurrent ? "▶" : ""}
          </PlayerSwatch>
          <select
            value={player.color}
            onChange={(e) => dispatch({ type: "recolorPlayer", id: player.id, color: e.target.value as PlayerColor })}
            className="absolute inset-0 h-11 w-11 cursor-pointer opacity-0"
            aria-label={`Color for ${player.name}: ${PLAYER_COLOR_LABEL[player.color]}`}
            disabled={game.status === "finished"}
          >
            {PLAYER_COLORS.map((c) => (
              <option key={c} value={c}>
                {PLAYER_COLOR_LABEL[c]}
              </option>
            ))}
          </select>
        </label>

        <Input
          value={player.name}
          onChange={(e) => dispatch({ type: "renamePlayer", id: player.id, name: e.target.value })}
          aria-label={`Name of player ${index + 1}`}
          className="min-w-0 flex-1 font-semibold"
          maxLength={16}
          disabled={game.status === "finished"}
        />

        {/* VP stepper */}
        <div className="flex items-center gap-1" role="group" aria-label={`${player.name} victory points`}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch({ type: "adjustVp", id: player.id, delta: -1, now: now() })}
            disabled={player.vp <= 0 || game.status === "finished"}
            aria-label={`${player.name} minus one point`}
          >
            <Minus />
          </Button>
          <div
            className={cn("w-10 text-center font-display text-2xl font-bold tabular-nums", shown >= WINNING_VP && "text-accent-foreground dark:text-accent")}
            aria-live="polite"
            aria-label={`${shown} of ${WINNING_VP} points`}
          >
            {shown}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch({ type: "adjustVp", id: player.id, delta: 1, now: now() })}
            disabled={game.status === "finished"}
            aria-label={`${player.name} plus one point`}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-0 sm:pl-10">
        <button
          type="button"
          aria-pressed={hasRoad}
          onClick={() => dispatch({ type: "toggleLongestRoad", id: player.id, now: now() })}
          disabled={game.status === "finished"}
          className={cn(
            "h-11 rounded-md border px-3 text-sm font-semibold touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
            hasRoad ? "border-hills bg-hills text-white" : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
          title="Longest Road, 2 VP. Moves to whoever holds it."
        >
          Longest Road +{LONGEST_ROAD_VP}
        </button>
        <button
          type="button"
          aria-pressed={hasArmy}
          onClick={() => dispatch({ type: "toggleLargestArmy", id: player.id, now: now() })}
          disabled={game.status === "finished"}
          className={cn(
            "h-11 rounded-md border px-3 text-sm font-semibold touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
            hasArmy ? "border-mountains bg-mountains text-white" : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
          title="Largest Army, 2 VP. Moves to whoever holds it."
        >
          Largest Army +{LARGEST_ARMY_VP}
        </button>

        {full && (
          <div className="flex items-center gap-1" role="group" aria-label={`${player.name} hidden victory point cards`}>
            <span className="text-xs font-semibold text-muted-foreground">Hidden VP</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => dispatch({ type: "setHiddenVp", id: player.id, value: player.hiddenVp - 1, now: now() })}
              disabled={player.hiddenVp <= 0 || game.status === "finished"}
              aria-label={`${player.name} hidden VP minus one`}
            >
              <Minus />
            </Button>
            <span className="w-5 text-center text-sm font-bold tabular-nums">{player.hiddenVp}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => dispatch({ type: "setHiddenVp", id: player.id, value: player.hiddenVp + 1, now: now() })}
              disabled={game.status === "finished"}
              aria-label={`${player.name} hidden VP plus one`}
            >
              <Plus />
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {setup ? (
            <>
              <label className="flex h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium">
                <input
                  type="radio"
                  name="starting-player"
                  checked={isStarting}
                  onChange={() => dispatch({ type: "setStartingPlayer", index })}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                Starts
              </label>
              <Button variant="ghost" size="icon" onClick={() => dispatch({ type: "movePlayer", from: index, to: index - 1 })} disabled={index === 0} aria-label={`Move ${player.name} up`}>
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch({ type: "movePlayer", from: index, to: index + 1 })}
                disabled={index === game.players.length - 1}
                aria-label={`Move ${player.name} down`}
              >
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => dispatch({ type: "removePlayer", id: player.id })} aria-label={`Remove ${player.name}`}>
                <Trash2 />
              </Button>
            </>
          ) : (
            isStarting && <span className="text-xs text-muted-foreground">Started</span>
          )}
        </div>
      </div>

      {full && (
        <Input
          value={player.hiddenNote}
          onChange={(e) => dispatch({ type: "setHiddenNote", id: player.id, note: e.target.value })}
          placeholder="Private note (e.g. 2 VP cards in hand)"
          aria-label={`${player.name} private note`}
          className="mt-2 h-11 text-sm sm:ml-10 sm:w-[calc(100%-2.5rem)]"
          maxLength={120}
        />
      )}
    </li>
  );
};
