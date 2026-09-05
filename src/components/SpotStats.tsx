import { formatPercent } from "@/lib/format";
import { RESOURCE_BAR } from "@/lib/resource-colors";
import { expectedCardsInTurns, probabilityAtLeastOneIn, resourceMix, spotHitProbability, spotPips, type Spot } from "@/lib/odds";
import { RESOURCES, RESOURCE_LABEL } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface SpotStatsProps {
  spot: Spot;
  turns: number;
  compact?: boolean;
}

/** The numbers for one spot: pips, per-roll odds, cards per 10 turns, mix, N-turn odds. */
export const SpotStats = ({ spot, turns, compact = false }: SpotStatsProps) => {
  const pips = spotPips(spot);
  const hit = spotHitProbability(spot);
  const per10 = expectedCardsInTurns(spot, 10);
  const atLeast = probabilityAtLeastOneIn(spot, turns);
  const mix = resourceMix(spot);
  const empty = spot.tokens.length === 0;

  return (
    <div className={cn("space-y-3", empty && "opacity-60")}>
      <dl className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        <Stat label="Pips" value={String(pips)} hint="Dots on the tokens. 14+ is a strong spot." />
        <Stat label="Produces on a roll" value={formatPercent(hit)} hint={`${Math.round(hit * 36)} of 36 dice combinations`} />
        <Stat label="Cards per 10 turns" value={per10.toFixed(1)} hint="Settlement. A city doubles it." />
        <Stat label={`≥1 card in ${turns} turn${turns === 1 ? "" : "s"}`} value={formatPercent(atLeast)} />
      </dl>

      <div>
        <div className="mb-1 flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Resource mix</span>
          <span>{empty ? "" : RESOURCES.filter((r) => mix[r] > 0).map((r) => `${RESOURCE_LABEL[r]} ${formatPercent(mix[r])}`).join(" · ")}</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={empty ? "No resources yet" : RESOURCES.filter((r) => mix[r] > 0).map((r) => `${RESOURCE_LABEL[r]} ${formatPercent(mix[r])}`).join(", ")}>
          {RESOURCES.map((r) => (mix[r] > 0 ? <div key={r} className={cn(RESOURCE_BAR[r], "transition-[width] duration-300")} style={{ width: `${mix[r] * 100}%` }} /> : null))}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-md bg-muted/60 p-2">
    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="font-display text-2xl font-bold tabular-nums leading-tight">{value}</dd>
    {hint && <dd className="text-[11px] leading-tight text-muted-foreground">{hint}</dd>}
  </div>
);
