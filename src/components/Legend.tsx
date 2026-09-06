import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Die } from "@/components/Die";
import { NumberToken } from "@/components/NumberToken";
import { PlayerSwatch } from "@/components/PlayerSwatch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Player } from "@/lib/game-state";
import { RESOURCE_BAR } from "@/lib/resource-colors";
import { RESOURCE_LABEL, RESOURCE_TERRAIN, RESOURCES, TERRAIN_LABEL } from "@/lib/rules";
import type { TabId } from "@/lib/ui-state";
import { cn } from "@/lib/utils";

interface LegendProps {
  /** Players in the current game, shown with their colors when present. */
  players: Player[];
  /** Active tab and phone flag, used to keep the button clear of the Roll bar and tab bar. */
  tab: TabId;
  isMobile: boolean;
}

/**
 * Floating "Key" button on every tab. Opens a legend for hex colors,
 * number tokens, harbors, dice, and player colors.
 */
export const LegendButton = ({ players, tab, isMobile }: LegendProps) => {
  const [open, setOpen] = useState(false);
  // Above the sticky Roll bar on the Roll tab, above the tab bar elsewhere, corner on desktop.
  const bottom = isMobile ? (tab === "roll" ? "bottom-[calc(9.5rem+var(--safe-bottom))]" : "bottom-[calc(4.75rem+var(--safe-bottom))]") : "bottom-4";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="secondary"
        className={cn("fixed right-3 z-20 h-12 rounded-full px-4 shadow-lg print:hidden", bottom)}
        aria-label="Open the color key"
        aria-haspopup="dialog"
      >
        <BookOpen /> Key
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Key</DialogTitle>
            <DialogDescription>What the colors and marks mean.</DialogDescription>
          </DialogHeader>

          <section aria-labelledby="key-terrain">
            <h3 id="key-terrain" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hexes and resources
            </h3>
            <ul className="grid grid-cols-2 gap-1.5 text-sm">
              {RESOURCES.map((r) => (
                <li key={r} className="flex items-center gap-2">
                  <span className={cn("clip-hex inline-block h-6 w-6 shrink-0", RESOURCE_BAR[r])} aria-hidden="true" />
                  <span>
                    <span className="font-semibold">{TERRAIN_LABEL[RESOURCE_TERRAIN[r]]}</span> <span className="text-muted-foreground">→ {RESOURCE_LABEL[r]}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="clip-hex inline-block h-6 w-6 shrink-0 bg-desert" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Desert</span> <span className="text-muted-foreground">→ nothing, robber starts here</span>
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="key-tokens">
            <h3 id="key-tokens" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Number tokens
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <NumberToken number={8} size="sm" />
                <span>
                  <span className="font-semibold text-hills">Red 6 and 8</span> <span className="text-muted-foreground">roll most often, 5 ways in 36 each</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <NumberToken number={3} size="sm" />
                <span>
                  <span className="font-semibold">Dots</span> <span className="text-muted-foreground">= ways to roll it in 36. More dots, more cards.</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground" aria-hidden="true">
                  7
                </span>
                <span>
                  <span className="font-semibold text-destructive">7</span> <span className="text-muted-foreground">has no token: robber moves, 8+ cards discard half</span>
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="key-harbors">
            <h3 id="key-harbors" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Harbors
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ecd8] text-xs font-bold text-[#2b1d12] ring-1 ring-black/30" aria-hidden="true">
                  3:1
                </span>
                <span>
                  <span className="font-semibold">3:1</span> <span className="text-muted-foreground">trade any three of a kind for one card</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={cn("inline-flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-full text-[10px] font-bold leading-none text-white ring-1 ring-black/30", RESOURCE_BAR.ore)} aria-hidden="true">
                  2:1<span>O</span>
                </span>
                <span>
                  <span className="font-semibold">2:1 + letter</span> <span className="text-muted-foreground">two of that resource for one card (L W G B O)</span>
                </span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="key-dice">
            <h3 id="key-dice" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dice
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <Die value={5} color="red" className="h-8 w-8" />
              <Die value={3} color="yellow" className="h-8 w-8" />
              <span className="text-muted-foreground">Red and yellow as in the box. The total is what produces.</span>
            </div>
          </section>

          {players.length > 0 && (
            <section aria-labelledby="key-players">
              <h3 id="key-players" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Players
              </h3>
              <ul className="grid grid-cols-2 gap-1.5 text-sm">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <PlayerSwatch color={p.color} />
                    <span className="truncate font-semibold">{p.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
