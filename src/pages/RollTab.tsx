import { useCallback, useEffect, useState } from "react";
import { Dices, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { Die } from "@/components/Die";
import { RobberSheet } from "@/components/RobberSheet";
import { RollHistogram } from "@/components/RollHistogram";
import { RollLog } from "@/components/RollLog";
import { Segmented } from "@/components/Segmented";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useRollAnimation } from "@/hooks/use-roll-animation";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { deckRemaining, remainingTotals } from "@/lib/dice";
import { buzz, buzzRobber, prefersReducedMotion } from "@/lib/haptics";
import { LOG_DISPLAY, lastRoll, recentRolls, rollReducer, type DiceMode, type RollAction, type RollEntry, type RollState } from "@/lib/roll-state";
import { DICE_TOTALS, TOKEN_NUMBERS } from "@/lib/rules";
import { isBoolean } from "@/lib/storage";
import type { UiMode } from "@/lib/ui-state";
import { cn } from "@/lib/utils";

const ANIMATE_KEY = "animate:v1";
const SHAKE_MS = 600;

const DICE_MODES = [
  { value: "dice", label: "True dice", hint: "Random 2d6 every roll" },
  { value: "deck", label: "Balanced deck", hint: "36 cards, one per combination, reshuffled with 5 left" },
] as const;

export interface RollTabProps {
  mode: UiMode;
  /** Roll state lives in App so a new game can clear it. */
  state: RollState;
  onChange: (next: RollState) => void;
  /** Player names in seating order. Enables the roller label and the robber checklist. */
  playerNames?: string[];
  /** Index of the player who rolls next; the roll is attributed to them. */
  rollerIndex?: number;
  /** Called after a roll settles so the game can advance the turn. */
  onRolled?: (playerIndex: number | undefined, total: number) => void;
  /** Called when the last roll is undone so the game can step the turn back. */
  onUndoRoll?: (entry: RollEntry) => void;
  /** 5-6 players: remind the table of the special building phase. */
  specialBuildPhase?: boolean;
}

export const RollTab = ({ mode, state, onChange, playerNames, rollerIndex, onRolled, onUndoRoll, specialBuildPhase = false }: RollTabProps) => {
  const full = mode === "full";
  const isMobile = useIsMobile();

  // A roll is computed first (to learn the total for haptics and the robber
  // sheet) and then stored, so the RNG runs exactly once per roll.
  const dispatch = useCallback((action: RollAction) => onChange(rollReducer(state, action)), [onChange, state]);
  const currentPlayerIndex = rollerIndex;

  const [animate, setAnimate] = usePersistedState<boolean>(ANIMATE_KEY, () => !prefersReducedMotion(), isBoolean);
  const { rolling, start } = useRollAnimation(animate);
  const isRolling = rolling !== null;

  const [robberOpen, setRobberOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [reshuffledNote, setReshuffledNote] = useState(false);

  const last = lastRoll(state);
  const shown = rolling ?? last;
  const total = shown ? shown.red + shown.yellow : null;
  const isSeven = !isRolling && total === 7;

  useWakeLock(state.log.length > 0);

  const roll = useCallback(() => {
    if (isRolling) return;
    const before = deckRemaining(state.deck);
    start(() => {
      const next = rollReducer(state, { type: "roll", playerIndex: currentPlayerIndex });
      onChange(next);
      const entry = lastRoll(next);
      if (!entry) return;
      if (state.mode === "deck" && deckRemaining(next.deck) > before) {
        setReshuffledNote(true);
      }
      if (entry.total === 7) {
        buzzRobber();
        setShaking(true);
        window.setTimeout(() => setShaking(false), SHAKE_MS);
        setRobberOpen(true);
      } else {
        buzz(30);
      }
      onRolled?.(currentPlayerIndex, entry.total);
    });
  }, [isRolling, start, state, currentPlayerIndex, onRolled, onChange]);

  const undo = () => {
    if (isRolling) return;
    const entry = lastRoll(state);
    if (!entry) return;
    dispatch({ type: "undo" });
    onUndoRoll?.(entry);
    setRobberOpen(false);
  };

  const setMode = (m: DiceMode) => {
    if (isRolling) return;
    dispatch({ type: "setMode", mode: m });
    setReshuffledNote(false);
  };

  const reset = () => {
    if (isRolling) return;
    dispatch({ type: "reset" });
    setReshuffledNote(false);
  };

  useKeyboardShortcuts({
    " ": roll,
    u: undo,
    d: () => setMode(state.mode === "dice" ? "deck" : "dice"),
  });

  useEffect(() => {
    if (!reshuffledNote) return;
    const t = window.setTimeout(() => setReshuffledNote(false), 4000);
    return () => clearTimeout(t);
  }, [reshuffledNote]);

  const rollerName = currentPlayerIndex !== undefined ? playerNames?.[currentPlayerIndex] : undefined;
  const lastRollerName = last?.playerIndex !== undefined ? playerNames?.[last.playerIndex] : undefined;
  const remaining = deckRemaining(state.deck);
  const remainingByTotal = full && state.mode === "deck" ? remainingTotals(state.deck) : null;

  const rollButton = (
    <Button onClick={roll} disabled={isRolling} size="lg" className="h-14 w-full text-lg font-bold" aria-keyshortcuts="Space">
      <Dices className="!size-6" />
      {rollerName ? `Roll for ${rollerName}` : "Roll"}
    </Button>
  );

  return (
    <div className={cn("space-y-4", isMobile && "pb-20")}>
      {/* Dice */}
      <Card className={cn("overflow-hidden", isSeven && "border-destructive/70")} aria-busy={isRolling}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
            <span>
              {isRolling ? "Rolling…" : last ? `Roll ${last.id}` : "Ready"}
              {!isRolling && lastRollerName ? ` · ${lastRollerName}` : ""}
            </span>
            <span>
              {state.mode === "deck" ? `${remaining} card${remaining === 1 ? "" : "s"} left` : "2d6"}
            </span>
          </div>

          <div className={cn("mt-3 flex items-center justify-center gap-4 sm:gap-8", shaking && "animate-robber-shake")}>
            <Die value={shown?.red ?? 1} color="red" rolling={isRolling} className="h-24 w-24 sm:h-32 sm:w-32" />
            <div className="min-w-[4.5rem] text-center" aria-live="polite" aria-atomic="true">
              <div
                className={cn(
                  "font-display text-6xl font-bold tabular-nums leading-none sm:text-7xl",
                  isSeven ? "text-destructive" : (total === 6 || total === 8) && !isRolling ? "text-hills" : "",
                )}
              >
                {shown ? total : "–"}
              </div>
              {!isRolling && isSeven && <div className="mt-1 text-sm font-bold uppercase tracking-wide text-destructive">Robber</div>}
            </div>
            <Die value={shown?.yellow ?? 1} color="yellow" rolling={isRolling} className="h-24 w-24 sm:h-32 sm:w-32" />
          </div>

          {reshuffledNote && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-secondary" role="status">
              <Shuffle className="h-4 w-4" /> Deck reshuffled
            </p>
          )}

          {specialBuildPhase && last && !isRolling && (
            <p className="mt-3 rounded-md bg-accent/20 px-3 py-2 text-center text-sm font-semibold" role="status">
              Special building phase after this turn: everyone else may build.
            </p>
          )}

          {!isMobile && <div className="mt-5">{rollButton}</div>}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Segmented value={state.mode} options={DICE_MODES} onChange={setMode} label="Dice mode" size="compact" disabled={isRolling} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={undo} disabled={isRolling || state.log.length === 0} aria-label="Undo last roll" title="Undo last roll (U)">
                <Undo2 />
                <span className="hidden sm:inline">Undo</span>
              </Button>
              {state.log.length > 0 && (
                <Button variant="ghost" size="icon" onClick={reset} disabled={isRolling} aria-label="Clear roll log" title="Clear roll log">
                  <RotateCcw />
                </Button>
              )}
            </div>
          </div>

          {remainingByTotal && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Cards left per total</p>
              <ul className="grid grid-cols-11 gap-1 text-center" aria-label="Cards remaining per total">
                {DICE_TOTALS.map((t) => (
                  <li key={t} className={cn("rounded-md bg-muted py-1 text-xs tabular-nums", !TOKEN_NUMBERS.includes(t) && "bg-destructive/15")}>
                    <div className="font-bold">{t}</div>
                    <div className="text-muted-foreground" aria-label={`${remainingByTotal[t]} left`}>
                      {remainingByTotal[t]}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {full && !isMobile && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <kbd className="rounded border px-1">Space</kbd> roll
              <span className="mx-2">·</span>
              <kbd className="rounded border px-1">U</kbd> undo
              <span className="mx-2">·</span>
              <kbd className="rounded border px-1">D</kbd> dice mode
              <span className="mx-2">·</span>
              <kbd className="rounded border px-1">M</kbd> game/full
            </p>
          )}
        </CardContent>
      </Card>

      {/* Log */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Last {LOG_DISPLAY} rolls</CardTitle>
            {full && (
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={animate} onChange={(e) => setAnimate(e.target.checked)} disabled={isRolling} />
                Animate
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RollLog rolls={recentRolls(state)} playerNames={playerNames} />
        </CardContent>
      </Card>

      {/* Histogram, Full mode only */}
      {full && state.log.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actual vs expected ({state.log.length} rolls)</CardTitle>
          </CardHeader>
          <CardContent>
            <RollHistogram totals={state.log.map((r) => r.total)} />
          </CardContent>
        </Card>
      )}

      {/* Phone: sticky Roll button above the tab bar */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+var(--safe-bottom))] z-20 border-t border-border/40 bg-background/85 p-3 backdrop-blur-md">
          {rollButton}
        </div>
      )}

      <RobberSheet open={robberOpen} onClose={() => setRobberOpen(false)} playerNames={playerNames} rollerName={lastRollerName} />
    </div>
  );
};
