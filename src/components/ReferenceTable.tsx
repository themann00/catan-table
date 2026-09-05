import { NumberToken } from "@/components/NumberToken";
import { formatPercent } from "@/lib/format";
import { REFERENCE_TABLE } from "@/lib/odds";
import { cn } from "@/lib/utils";

/** 2-12: ways out of 36, chance per roll, pips. Bars are proportional. */
export const ReferenceTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[20rem] text-sm">
      <caption className="sr-only">Chance of each dice total per roll</caption>
      <thead>
        <tr className="text-left text-xs font-semibold text-muted-foreground">
          <th scope="col" className="py-1 pr-2">
            Total
          </th>
          <th scope="col" className="py-1 pr-2">
            Ways / 36
          </th>
          <th scope="col" className="py-1 pr-2">
            Per roll
          </th>
          <th scope="col" className="py-1">
            <span className="sr-only">Relative frequency</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {REFERENCE_TABLE.map((row) => (
          <tr key={row.total} className="border-t border-border/50">
            <th scope="row" className="py-1 pr-2 font-normal">
              {row.total === 7 ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground" role="img" aria-label="7, robber">
                  7
                </span>
              ) : (
                <NumberToken number={row.total} size="sm" />
              )}
            </th>
            <td className="py-1 pr-2 tabular-nums">{row.ways}</td>
            <td className="py-1 pr-2 tabular-nums">{formatPercent(row.probability, 1)}</td>
            <td className="w-1/2 py-1">
              <div className="h-2.5 w-full rounded-full bg-muted" aria-hidden="true">
                <div className={cn("h-full rounded-full", row.total === 7 ? "bg-destructive/80" : row.total === 6 || row.total === 8 ? "bg-hills" : "bg-secondary/70")} style={{ width: `${(row.ways / 6) * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
