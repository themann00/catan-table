import { actualCounts, expectedCounts } from "@/lib/dice";
import { DICE_TOTALS } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface RollHistogramProps {
  totals: number[];
}

/**
 * Actual roll counts per total against the expected count for the same
 * number of rolls. Bars are actual; the tick is expected.
 */
export const RollHistogram = ({ totals }: RollHistogramProps) => {
  const n = totals.length;
  const actual = actualCounts(totals);
  const expected = expectedCounts(n);
  const max = Math.max(1, ...DICE_TOTALS.map((t) => Math.max(actual[t], expected[t])));

  return (
    <div className="space-y-2">
      <div
        className="grid h-40 grid-cols-11 items-end gap-1"
        role="img"
        aria-label={`Histogram of ${n} rolls. ${DICE_TOTALS.map((t) => `${t}: ${actual[t]} rolled, ${expected[t].toFixed(1)} expected`).join(". ")}`}
      >
        {DICE_TOTALS.map((t) => {
          const h = (actual[t] / max) * 100;
          const e = (expected[t] / max) * 100;
          return (
            <div key={t} className="relative flex h-full flex-col justify-end">
              <div
                className={cn("w-full rounded-t-sm", t === 7 ? "bg-destructive/80" : t === 6 || t === 8 ? "bg-hills" : "bg-secondary/70")}
                style={{ height: `${h}%` }}
              />
              {n > 0 && (
                <div
                  className="absolute inset-x-0 border-t-2 border-dashed border-foreground/70"
                  style={{ bottom: `${e}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-11 gap-1 text-center text-xs font-semibold tabular-nums" aria-hidden="true">
        {DICE_TOTALS.map((t) => (
          <div key={t} className={cn(t === 7 && "text-destructive", (t === 6 || t === 8) && "text-hills")}>
            {t}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-11 gap-1 text-center text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
        {DICE_TOTALS.map((t) => (
          <div key={t}>{actual[t]}</div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Bars are what was rolled. Dashed line is what {n} fair roll{n === 1 ? "" : "s"} would produce on average (7 is 6 in 36, 2 and 12 are 1 in 36).
      </p>
    </div>
  );
};
