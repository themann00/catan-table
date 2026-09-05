import { X } from "lucide-react";
import { NumberToken } from "@/components/NumberToken";
import { ResourceChip } from "@/components/ResourceChip";
import { Button } from "@/components/ui/button";
import { MAX_SPOT_TOKENS, type Spot } from "@/lib/odds";
import { RESOURCES, RESOURCE_LABEL, TOKEN_NUMBERS, type Resource } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface SpotBuilderProps {
  label: string;
  spot: Spot;
  onChange: (spot: Spot) => void;
}

/** Sensible default so the first tap gives a full token: rotate through resources. */
const nextResource = (spot: Spot): Resource => RESOURCES[spot.tokens.length % RESOURCES.length];

/**
 * Tap a number chip to add a hex to the spot (up to three), then set each
 * hex's resource. Tokens can be removed individually.
 */
export const SpotBuilder = ({ label, spot, onChange }: SpotBuilderProps) => {
  const fullSpot = spot.tokens.length >= MAX_SPOT_TOKENS;

  const add = (number: number) => {
    if (fullSpot) return;
    onChange({ tokens: [...spot.tokens, { number, resource: nextResource(spot) }] });
  };
  const setResource = (i: number, resource: Resource) =>
    onChange({ tokens: spot.tokens.map((t, j) => (j === i ? { ...t, resource } : t)) });
  const remove = (i: number) => onChange({ tokens: spot.tokens.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        {spot.tokens.length > 0 && (
          <Button variant="ghost" size="sm" className="h-11 text-muted-foreground" onClick={() => onChange({ tokens: [] })}>
            Clear
          </Button>
        )}
      </div>

      <div role="group" aria-label={`${label}: add a hex by number`} className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {TOKEN_NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => add(n)}
            disabled={fullSpot}
            aria-label={`Add a ${n} hex`}
            className={cn(
              "flex h-12 items-center justify-center rounded-md border border-border bg-card touch-manipulation transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
            )}
          >
            <NumberToken number={n} size="sm" />
          </button>
        ))}
      </div>

      {spot.tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tap up to three numbers, one per hex the settlement touches.</p>
      ) : (
        <ul className="space-y-2">
          {spot.tokens.map((t, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-card p-2">
              <NumberToken number={t.number} />
              <span className="flex-1 text-sm font-semibold sm:hidden">{RESOURCE_LABEL[t.resource]}</span>
              {/* Phones: chips take their own full-width row so each stays a 44px target. */}
              <div className="order-last grid basis-full grid-cols-5 gap-1 sm:order-none sm:flex-1 sm:basis-auto" role="group" aria-label={`Resource for the ${t.number} hex`}>
                {RESOURCES.map((r) => (
                  <ResourceChip key={r} resource={r} selected={t.resource === r} onClick={() => setResource(i, r)} short className="w-full" />
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label={`Remove the ${t.number} hex`}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
