import { RESOURCE_BG } from "@/lib/resource-colors";
import { RESOURCE_LABEL, RESOURCE_TERRAIN, type Resource } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface ResourceChipProps {
  resource: Resource;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  short?: boolean;
}

/** Colored resource label. Becomes a toggle button when given onClick. */
export const ResourceChip = ({ resource, selected = false, onClick, className, short = false }: ResourceChipProps) => {
  const label = short ? RESOURCE_LABEL[resource].slice(0, 1) : RESOURCE_LABEL[resource];
  const base = cn("inline-flex items-center justify-center rounded-md px-2 text-xs font-bold", RESOURCE_BG[resource], className);
  if (!onClick) {
    return (
      <span className={cn(base, "h-6")} title={RESOURCE_LABEL[resource]}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${RESOURCE_LABEL[resource]} (${RESOURCE_TERRAIN[resource]})`}
      className={cn(
        base,
        "h-11 min-w-11 touch-manipulation transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "ring-2 ring-foreground ring-offset-1 ring-offset-background" : "opacity-60 hover:opacity-100",
      )}
    >
      {label}
    </button>
  );
};
