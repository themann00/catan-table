import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_CARD_LABEL, DEV_CARD_TYPES, nextCardOdds, remainingDeck, type DevCardType } from "@/lib/dev-cards";
import type { GameAction, GameState } from "@/lib/game-state";
import { rulesFor } from "@/lib/game-state";
import { devDeckSize } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface DevCardTrackerProps {
  game: GameState;
  dispatch: (action: GameAction) => void;
  full: boolean;
}

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Tap a card type as it is drawn. Shows the deck left and next-draw odds. */
export const DevCardTracker = ({ game, dispatch, full }: DevCardTrackerProps) => {
  const rules = rulesFor(game);
  const remaining = remainingDeck(rules.devDeck, game.devCardsDrawn);
  const odds = nextCardOdds(remaining);
  const total = devDeckSize(rules.devDeck);
  const left = devDeckSize(remaining);
  const disabled = game.status === "finished";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Development cards</CardTitle>
            <CardDescription>
              {left} of {total} left · {rules.name}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-11" onClick={() => dispatch({ type: "undoDevCard" })} disabled={game.devCardsDrawn.length === 0 || disabled} aria-label="Undo last draw">
            <Undo2 /> Undo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DEV_CARD_TYPES.map((t) => (
            <DrawButton key={t} type={t} left={remaining[t]} total={rules.devDeck[t]} disabled={disabled || remaining[t] === 0} onDraw={() => dispatch({ type: "drawDevCard", card: t })} />
          ))}
        </div>

        <div className="space-y-1" role="group" aria-label={`Next card odds: knight ${pct(odds.knight)}, victory point ${pct(odds.victoryPoint)}, progress ${pct(odds.progress)}`}>
          <div className="flex justify-between text-xs font-semibold tabular-nums">
            <span className="text-mountains">Knight {pct(odds.knight)}</span>
            <span className="text-accent-foreground dark:text-accent">VP {pct(odds.victoryPoint)}</span>
            <span className="text-forest">Progress {pct(odds.progress)}</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="bg-mountains transition-[width] duration-300" style={{ width: `${odds.knight * 100}%` }} />
            <div className="bg-accent transition-[width] duration-300" style={{ width: `${odds.victoryPoint * 100}%` }} />
            <div className="flex-1 bg-forest" />
          </div>
          <p className="text-xs text-muted-foreground">Odds the next card drawn is each kind, from what is still in the deck.</p>
        </div>

        {full && game.devCardsDrawn.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Drawn so far: {game.devCardsDrawn.map((c) => DEV_CARD_LABEL[c]).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface DrawButtonProps {
  type: DevCardType;
  left: number;
  total: number;
  disabled: boolean;
  onDraw: () => void;
}

const DrawButton = ({ type, left, total, disabled, onDraw }: DrawButtonProps) => (
  <button
    type="button"
    onClick={onDraw}
    disabled={disabled}
    className={cn(
      "flex h-14 flex-col items-center justify-center rounded-md border border-border bg-card px-2 text-center touch-manipulation transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
      type === "knight" && "border-mountains/50",
      type === "victoryPoint" && "border-accent/60",
    )}
    aria-label={`Drew ${DEV_CARD_LABEL[type]}, ${left} of ${total} left`}
  >
    <span className="text-sm font-semibold leading-tight">{DEV_CARD_LABEL[type]}</span>
    <span className="text-xs tabular-nums text-muted-foreground">
      {left}/{total}
    </span>
  </button>
);
