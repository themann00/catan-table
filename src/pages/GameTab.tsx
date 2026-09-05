import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, RotateCcw } from "lucide-react";
import { DevCardTracker } from "@/components/DevCardTracker";
import { GameHistory } from "@/components/GameHistory";
import { PlayerRow } from "@/components/PlayerRow";
import { PlayerSwatch } from "@/components/PlayerSwatch";
import { TurnTimer } from "@/components/TurnTimer";
import { WinDialog } from "@/components/WinDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  currentPlayer,
  rulesFor,
  type GameAction,
  type GameState,
  type GameSummary,
} from "@/lib/game-state";
import { WINNING_VP } from "@/lib/rules";
import type { UiMode } from "@/lib/ui-state";

export interface GameTabProps {
  mode: UiMode;
  game: GameState;
  dispatch: (action: GameAction) => void;
  history: GameSummary[];
  /** Resets the game (and the roll log) keeping the player list. */
  onNewGame: (keepPlayers: boolean) => void;
  /** Win dialog visibility lives in App so it can open from any tab. */
  winOpen: boolean;
  onWinClose: () => void;
}

export const GameTab = ({ mode, game, dispatch, history, onNewGame, winOpen, onWinClose }: GameTabProps) => {
  const full = mode === "full";
  const rules = rulesFor(game);
  const current = currentPlayer(game);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const now = () => Date.now();

  const canStart = game.status === "setup" && game.players.length >= MIN_PLAYERS;

  return (
    <div className="space-y-4">
      {/* Turn strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          {game.status === "setup" && (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Set up the table</p>
                <p className="text-sm text-muted-foreground">
                  {game.players.length} player{game.players.length === 1 ? "" : "s"} · {rules.name}
                  {game.players.length < MIN_PLAYERS ? ` · need ${MIN_PLAYERS - game.players.length} more` : ""}
                </p>
              </div>
              <Button onClick={() => dispatch({ type: "startGame", now: now() })} disabled={!canStart} size="lg">
                <Play /> Start game
              </Button>
            </>
          )}

          {game.status === "playing" && current && (
            <>
              <PlayerSwatch color={current.color} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {current.name}
                  {game.rolledThisTurn ? " is building" : " to roll"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Turn {game.turnCount + 1} · first to {WINNING_VP} VP
                  {rules.specialBuildPhase ? " · special build phase on" : ""}
                </p>
              </div>
              {game.timerEnabled && <TurnTimer since={game.turnStartedAt} />}
              <div className="flex w-full gap-1 sm:w-auto">
                <Button variant="outline" size="icon" onClick={() => dispatch({ type: "previousTurn", now: now() })} disabled={game.turnCount === 0} aria-label="Previous player">
                  <ChevronLeft />
                </Button>
                <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => dispatch({ type: "nextTurn", now: now() })} aria-label="End turn, next player">
                  End turn <ChevronRight />
                </Button>
              </div>
            </>
          )}

          {game.status === "finished" && (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Game over</p>
                <p className="text-sm text-muted-foreground">{game.players.find((p) => p.id === game.winnerId)?.name} reached {WINNING_VP} VP.</p>
              </div>
              <Button onClick={() => onNewGame(true)} size="lg">
                <RotateCcw /> New game
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Players</CardTitle>
              {game.status === "setup" && (
                <CardDescription>
                  Order is seating order, clockwise. Pick who starts.
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {full && (
                <label className="flex h-11 items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={game.timerEnabled}
                    onChange={(e) => dispatch({ type: "setTimerEnabled", enabled: e.target.checked, now: now() })}
                  />
                  Turn timer
                </label>
              )}
              {game.status !== "finished" && (
                <Button variant="outline" size="sm" className="h-11" onClick={() => dispatch({ type: "addPlayer" })} disabled={game.players.length >= MAX_PLAYERS}>
                  <Plus /> Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {game.players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add at least three players.</p>
          ) : (
            <ol className="space-y-2">
              {game.players.map((p, i) => (
                <PlayerRow
                  key={p.id}
                  game={game}
                  player={p}
                  index={i}
                  dispatch={dispatch}
                  full={full}
                  dragging={dragFrom === i}
                  onDragStart={setDragFrom}
                  onDropOn={(to) => {
                    if (dragFrom !== null) dispatch({ type: "movePlayer", from: dragFrom, to });
                    setDragFrom(null);
                  }}
                />
              ))}
            </ol>
          )}
          {game.status !== "setup" && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" className="h-11 text-muted-foreground" onClick={() => onNewGame(true)}>
                <RotateCcw /> Reset game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DevCardTracker game={game} dispatch={dispatch} full={full} />

      {full && <GameHistory history={history} />}

      <WinDialog game={game} open={winOpen && game.status === "finished"} onClose={onWinClose} onNewGame={() => onNewGame(true)} />
    </div>
  );
};
