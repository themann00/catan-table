import { cn } from "@/lib/utils";
import type { UiMode } from "@/lib/ui-state";

interface ModeToggleProps {
  mode: UiMode;
  onChange: (mode: UiMode) => void;
}

const OPTIONS: ReadonlyArray<{ value: UiMode; label: string; hint: string }> = [
  { value: "game", label: "Game", hint: "Only what the table needs" },
  { value: "full", label: "Full", hint: "Adds stats and odds" },
];

/** Game mode / Full mode segmented control. Radios under the hood for a11y. */
export const ModeToggle = ({ mode, onChange }: ModeToggleProps) => (
  <div role="radiogroup" aria-label="Display mode" className="flex rounded-lg border border-border/70 bg-muted/70 p-1">
    {OPTIONS.map((option) => {
      const selected = mode === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          title={option.hint}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-11 min-w-[4.25rem] rounded-md px-3 text-sm font-semibold transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected ? "bg-primary text-primary-foreground shadow" : "text-foreground/80 hover:bg-background/60",
          )}
        >
          {option.label}
          <span className="sr-only"> mode</span>
        </button>
      );
    })}
  </div>
);
