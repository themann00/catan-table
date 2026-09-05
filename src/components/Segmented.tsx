import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  label: string;
  /** Compact fits inside toolbars; regular is a 44px control. */
  size?: "compact" | "regular";
  className?: string;
  disabled?: boolean;
}

/** Segmented radio group. 44px targets in both sizes; compact only trims width. */
export function Segmented<T extends string>({ value, options, onChange, label, size = "regular", className, disabled }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-lg border border-border/70 bg-muted/70 p-1", className)}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.hint}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 rounded-md text-sm font-semibold transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              size === "compact" ? "min-w-[4.25rem] px-3" : "flex-1 px-4",
              selected ? "bg-primary text-primary-foreground shadow" : "text-foreground/80 hover:bg-background/60",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
