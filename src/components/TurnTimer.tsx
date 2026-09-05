import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatElapsed } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TurnTimerProps {
  /** Epoch ms when the turn began. */
  since: number | null;
  className?: string;
}

/** Elapsed time this turn, ticking once a second while mounted. */
export const TurnTimer = ({ since, className }: TurnTimerProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (since === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);

  if (since === null) return null;
  const elapsed = now - since;
  const long = elapsed > 3 * 60_000;

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-semibold tabular-nums", long && "bg-destructive/15 text-destructive", className)}
      role="timer"
      aria-label={`Turn time ${formatElapsed(elapsed)}`}
    >
      <Timer className="h-4 w-4" aria-hidden="true" />
      {formatElapsed(elapsed)}
    </span>
  );
};
