import { Minus, Plus } from "lucide-react";
import { ReferenceTable } from "@/components/ReferenceTable";
import { SpotBuilder } from "@/components/SpotBuilder";
import { SpotStats } from "@/components/SpotStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { formatPercent } from "@/lib/format";
import { compareShare, emptySpot, expectedCardsInTurns, isSpot, spotPips, type Spot } from "@/lib/odds";
import { isBoolean, isNumber } from "@/lib/storage";
import { cn } from "@/lib/utils";

const SPOT_A_KEY = "odds:spotA:v1";
const SPOT_B_KEY = "odds:spotB:v1";
const COMPARE_KEY = "odds:compare:v1";
const TURNS_KEY = "odds:turns:v1";

/** "A produces 2.5× as much." above double, "B produces 30% more." below. */
const describeLead = (share: number): string => {
  const lead = share > 0.5 ? "A" : "B";
  const ratio = Math.max(share, 1 - share) / Math.min(share, 1 - share);
  return ratio >= 2 ? `${lead} produces ${ratio.toFixed(1)}× as much.` : `${lead} produces ${formatPercent(ratio - 1)} more.`;
};

const MIN_TURNS = 1;
const MAX_TURNS = 30;
const isTurns = (v: unknown): v is number => isNumber(v) && v >= MIN_TURNS && v <= MAX_TURNS;

export const OddsTab = () => {
  const [spotA, setSpotA] = usePersistedState<Spot>(SPOT_A_KEY, emptySpot, isSpot);
  const [spotB, setSpotB] = usePersistedState<Spot>(SPOT_B_KEY, emptySpot, isSpot);
  const [compare, setCompare] = usePersistedState<boolean>(COMPARE_KEY, false, isBoolean);
  const [turns, setTurns] = usePersistedState<number>(TURNS_KEY, 10, isTurns);

  const share = compareShare(spotA, spotB);
  const bothSet = spotA.tokens.length > 0 && spotB.tokens.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settlement spot</CardTitle>
          <CardDescription>Pick the numbers around an intersection to see how often it pays.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SpotBuilder label={compare ? "Spot A" : "Spot"} spot={spotA} onChange={setSpotA} />
          <SpotStats spot={spotA} turns={turns} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2" role="group" aria-label="Turns for the at-least-one-card odds">
              <span className="text-sm font-semibold">Turns</span>
              <Button variant="outline" size="icon" onClick={() => setTurns((t) => Math.max(MIN_TURNS, t - 1))} disabled={turns <= MIN_TURNS} aria-label="Fewer turns">
                <Minus />
              </Button>
              <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
                {turns}
              </span>
              <Button variant="outline" size="icon" onClick={() => setTurns((t) => Math.min(MAX_TURNS, t + 1))} disabled={turns >= MAX_TURNS} aria-label="More turns">
                <Plus />
              </Button>
            </div>
            <label className="flex h-11 items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
              Compare with a second spot
            </label>
          </div>
        </CardContent>
      </Card>

      {compare && (
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-5">
            <SpotBuilder label="Spot B" spot={spotB} onChange={setSpotB} />
            <SpotStats spot={spotB} turns={turns} />

            <div className="space-y-1 border-t border-border/60 pt-3" role="group" aria-label={bothSet ? `Spot A gets ${formatPercent(share)} of the combined production, Spot B ${formatPercent(1 - share)}` : "Build both spots to compare"}>
              <div className="flex items-center justify-between text-sm font-semibold tabular-nums">
                <span className="text-secondary">
                  A · {spotPips(spotA)} pips · {expectedCardsInTurns(spotA, 10).toFixed(1)}/10 turns
                </span>
                <span className="text-hills">
                  B · {spotPips(spotB)} pips · {expectedCardsInTurns(spotB, 10).toFixed(1)}/10 turns
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="bg-secondary transition-[width] duration-300" style={{ width: `${share * 100}%` }} />
                <div className="flex-1 bg-hills" />
              </div>
              <p className={cn("text-center text-sm font-semibold", !bothSet && "text-muted-foreground")}>
                {!bothSet
                  ? "Build both spots to compare."
                  : share === 0.5
                    ? "Even production."
                    : describeLead(share)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dice odds, 2 to 12</CardTitle>
          <CardDescription>Two six-sided dice make 36 combinations. Pips on a token equal its ways.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferenceTable />
        </CardContent>
      </Card>
    </div>
  );
};
