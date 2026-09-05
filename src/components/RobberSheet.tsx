import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROBBER_DISCARD_ABOVE } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface RobberSheetProps {
  open: boolean;
  onClose: () => void;
  /** Names to tick off as they discard. Optional until players exist. */
  playerNames?: string[];
  /** Player who rolled the 7 and moves the robber. */
  rollerName?: string;
}

/**
 * Shown on every 7. A real dialog: focus moves in, Escape closes, the
 * checklist resets each time it opens.
 */
export const RobberSheet = ({ open, onClose, playerNames = [], rollerName }: RobberSheetProps) => {
  const [discarded, setDiscarded] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (open) setDiscarded(new Set());
  }, [open]);

  const toggle = (i: number) =>
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-destructive/60" aria-describedby="robber-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <span aria-hidden="true" className="text-2xl">
              🕵️
            </span>
            Robber!
          </DialogTitle>
          <DialogDescription id="robber-desc" className="text-base text-foreground">
            Anyone with {ROBBER_DISCARD_ABOVE + 1}+ cards discards half (round down).
            {rollerName ? ` ${rollerName} moves` : " Move"} the robber and steal one card.
          </DialogDescription>
        </DialogHeader>

        {playerNames.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Who discarded?</p>
            <ul className="grid grid-cols-2 gap-2">
              {playerNames.map((name, i) => {
                const done = discarded.has(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      aria-pressed={done}
                      onClick={() => toggle(i)}
                      className={cn(
                        "flex h-12 w-full items-center gap-2 rounded-md border px-3 text-left text-sm font-semibold touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        done ? "border-primary bg-primary/15 line-through" : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("inline-flex h-5 w-5 items-center justify-center rounded border text-xs", done ? "border-primary bg-primary text-primary-foreground" : "border-border")}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="truncate">{name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Button onClick={onClose} size="lg" className="w-full">
          Robber moved
        </Button>
      </DialogContent>
    </Dialog>
  );
};
