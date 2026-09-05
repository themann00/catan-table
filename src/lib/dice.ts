import { DICE_TOTALS, DICE_TOTAL_WAYS, DICE_WAYS } from "./rules";
import { cryptoRng, randomInt, shuffle, type Rng } from "./rng";

/** One red die and one yellow die, as in the Catan box. */
export interface DicePair {
  red: number;
  yellow: number;
}

export const diceTotal = (d: DicePair): number => d.red + d.yellow;

/** Fair 2d6. */
export function rollDice(rng: Rng = cryptoRng): DicePair {
  return { red: 1 + randomInt(rng, 6), yellow: 1 + randomInt(rng, 6) };
}

/**
 * Balanced deck: one card per ordered die combination, so 36 cards whose
 * totals follow the exact 2d6 distribution. Modeled on the CATAN Event Cards
 * dice deck (36 cards, reshuffled with 5 cards left so the tail cannot be
 * counted). https://boardgamegeek.com/boardgame/20038/catan-event-cards
 */
export const DECK_SIZE = 36;
export const DECK_RESHUFFLE_AT = 5;

export interface DeckState {
  /** Shuffled order. Cards before `drawn` have been used. */
  cards: readonly DicePair[];
  drawn: number;
}

export const ALL_COMBINATIONS: readonly DicePair[] = (() => {
  const out: DicePair[] = [];
  for (let red = 1; red <= 6; red++) for (let yellow = 1; yellow <= 6; yellow++) out.push({ red, yellow });
  return out;
})();

export function newDeck(rng: Rng = cryptoRng): DeckState {
  return { cards: shuffle(ALL_COMBINATIONS, rng), drawn: 0 };
}

export const deckRemaining = (deck: DeckState): number => deck.cards.length - deck.drawn;

/**
 * Draw the top card. When the draw leaves DECK_RESHUFFLE_AT or fewer cards,
 * the deck is reshuffled immediately and those tail cards are never seen.
 */
export function drawCard(deck: DeckState, rng: Rng = cryptoRng): { card: DicePair; deck: DeckState; reshuffled: boolean } {
  const card = deck.cards[deck.drawn];
  const next: DeckState = { cards: deck.cards, drawn: deck.drawn + 1 };
  if (deckRemaining(next) <= DECK_RESHUFFLE_AT) {
    return { card, deck: newDeck(rng), reshuffled: true };
  }
  return { card, deck: next, reshuffled: false };
}

/** Count of undrawn cards per total, 2 through 12. */
export function remainingTotals(deck: DeckState): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const t of DICE_TOTALS) counts[t] = 0;
  for (let i = deck.drawn; i < deck.cards.length; i++) counts[diceTotal(deck.cards[i])]++;
  return counts;
}

/** Probability the next card shows `total`, given the visible deck state. */
export const deckProbability = (deck: DeckState, total: number): number => {
  const remaining = deckRemaining(deck);
  return remaining === 0 ? 0 : remainingTotals(deck)[total] / remaining;
};

/** Expected count of each total after `n` fair rolls. */
export function expectedCounts(n: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const t of DICE_TOTALS) out[t] = (n * DICE_WAYS[t]) / DICE_TOTAL_WAYS;
  return out;
}

/** Observed count of each total in a list of rolls. */
export function actualCounts(totals: readonly number[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const t of DICE_TOTALS) out[t] = 0;
  for (const t of totals) if (t in out) out[t]++;
  return out;
}
