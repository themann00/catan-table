import { cn } from "@/lib/utils";

type Spot = "tl" | "tr" | "bl" | "br" | "ml" | "mr" | "c";

const FACES: Record<number, Spot[]> = {
  1: ["c"],
  2: ["tl", "br"],
  3: ["tl", "c", "br"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "c", "bl", "br"],
  6: ["tl", "ml", "bl", "tr", "mr", "br"],
};

/** Pip positions as percentages of the die face. */
const POS: Record<Spot, { x: number; y: number }> = {
  tl: { x: 25, y: 25 },
  tr: { x: 75, y: 25 },
  ml: { x: 25, y: 50 },
  mr: { x: 75, y: 50 },
  bl: { x: 25, y: 75 },
  br: { x: 75, y: 75 },
  c: { x: 50, y: 50 },
};

interface DieProps {
  value: number;
  color: "red" | "yellow";
  /** Tumbling placeholder; the value shown is not final. */
  rolling?: boolean;
  className?: string;
}

/**
 * One Catan die drawn as SVG so it scales cleanly from a 40px log chip to
 * a 128px hero. Red die has white pips, yellow die has dark pips.
 */
export const Die = ({ value, color, rolling = false, className }: DieProps) => {
  const spots = FACES[value] ?? [];
  const label = rolling ? `${color} die rolling` : `${color} die showing ${value}`;
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={cn("drop-shadow-md", rolling && "animate-dice-shake", className)}
    >
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="18"
        className={color === "red" ? "fill-die-red" : "fill-die-yellow"}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="2"
      />
      {spots.map((s) => (
        <circle
          key={s}
          cx={POS[s].x}
          cy={POS[s].y}
          r="9"
          className={color === "red" ? "fill-white" : "fill-[#2b1d12]"}
        />
      ))}
    </svg>
  );
};
