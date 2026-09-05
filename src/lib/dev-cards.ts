import type { DevDeck } from "./rules";
import { devDeckSize } from "./rules";

/**
 * Development card tracker math. The table taps a card type when someone
 * draws; the remaining deck and the odds for the next draw follow.
 * Deck sizes come from rules.ts (25 base, 34 with the 5-6 extension).
 */
export type DevCardType = keyof DevDeck;

export const DEV_CARD_TYPES: readonly DevCardType[] = ["knight", "victoryPoint", "roadBuilding", "yearOfPlenty", "monopoly"];
export const PROGRESS_TYPES: readonly DevCardType[] = ["roadBuilding", "yearOfPlenty", "monopoly"];

export const DEV_CARD_LABEL: Record<DevCardType, string> = {
  knight: "Knight",
  victoryPoint: "Victory Point",
  roadBuilding: "Road Building",
  yearOfPlenty: "Year of Plenty",
  monopoly: "Monopoly",
};

export const isDevCardType = (v: unknown): v is DevCardType => DEV_CARD_TYPES.includes(v as DevCardType);

/** Cards still in the deck after the drawn ones are removed. Never negative. */
export function remainingDeck(full: DevDeck, drawn: readonly DevCardType[]): DevDeck {
  const out: DevDeck = { ...full };
  for (const t of drawn) out[t] = Math.max(0, out[t] - 1);
  return out;
}

/** True when another card of this type can still be drawn. */
export const canDraw = (remaining: DevDeck, type: DevCardType): boolean => remaining[type] > 0;

export interface NextCardOdds {
  knight: number;
  victoryPoint: number;
  progress: number;
  /** Cards left in the deck. */
  remaining: number;
}

/** Probability the next card is a knight, a VP, or any progress card. */
export function nextCardOdds(remaining: DevDeck): NextCardOdds {
  const total = devDeckSize(remaining);
  if (total === 0) return { knight: 0, victoryPoint: 0, progress: 0, remaining: 0 };
  const progress = PROGRESS_TYPES.reduce((sum, t) => sum + remaining[t], 0);
  return {
    knight: remaining.knight / total,
    victoryPoint: remaining.victoryPoint / total,
    progress: progress / total,
    remaining: total,
  };
}
