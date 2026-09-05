import { pipsFor } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface NumberTokenProps {
  number: number;
  size?: "sm" | "md";
  className?: string;
}

/** Round number token with pips, red for 6 and 8 like the printed ones. */
export const NumberToken = ({ number, size = "md", className }: NumberTokenProps) => {
  const red = number === 6 || number === 8;
  const pips = pipsFor(number);
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full bg-[#f4ecd8] text-[#2b1d12] shadow ring-1 ring-black/30",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        className,
      )}
      role="img"
      aria-label={`${number}, ${pips} pip${pips === 1 ? "" : "s"}`}
    >
      <span className={cn("font-display font-bold leading-none", size === "md" ? "text-base" : "text-sm", red && "text-[#b3261e]")}>{number}</span>
      <span className={cn("mt-0.5 flex gap-px leading-none", size === "md" ? "text-[6px]" : "text-[5px]")} aria-hidden="true">
        {Array.from({ length: pips }, (_, i) => (
          <span key={i} className={cn("inline-block h-[3px] w-[3px] rounded-full", red ? "bg-[#b3261e]" : "bg-[#2b1d12]")} />
        ))}
      </span>
    </span>
  );
};
