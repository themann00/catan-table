import { PLAYER_COLOR_HEX, PLAYER_COLOR_INK, PLAYER_COLOR_LABEL } from "@/lib/player-colors";
import type { PlayerColor } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface PlayerSwatchProps {
  color: PlayerColor;
  className?: string;
  /** Optional short text drawn inside the swatch, e.g. a VP total. */
  children?: React.ReactNode;
}

/** Colored disc for a player. Decorative unless it carries children. */
export const PlayerSwatch = ({ color, className, children }: PlayerSwatchProps) => (
  <span
    className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ring-1 ring-black/25", className)}
    style={{ backgroundColor: PLAYER_COLOR_HEX[color], color: PLAYER_COLOR_INK[color] }}
    aria-label={children ? undefined : PLAYER_COLOR_LABEL[color]}
    role={children ? undefined : "img"}
  >
    {children}
  </span>
);
