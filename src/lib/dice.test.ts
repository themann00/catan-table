import { describe, expect, it } from "vitest";
import {
  ALL_COMBINATIONS,
  DECK_RESHUFFLE_AT,
  DECK_SIZE,
  actualCounts,
  deckProbability,
  deckRemaining,
  diceTotal,
  drawCard,
  expectedCounts,
  newDeck,
  remainingTotals,
  rollDice,
} from "./dice";
import { DICE_TOTALS, DICE_WAYS } from "./rules";
import { seededRng } from "./rng";

describe("rollDice", () => {
  it("stays within 1-6 on both dice", () => {
    const rng = seededRng(7);
    for (let i = 0; i < 2000; i++) {
      const d = rollDice(rng);
      expect(d.red).toBeGreaterThanOrEqual(1);
      expect(d.red).toBeLessThanOrEqual(6);
      expect(d.yellow).toBeGreaterThanOrEqual(1);
      expect(d.yellow).toBeLessThanOrEqual(6);
    }
  });

  it("is deterministic for a seed", () => {
    const a = seededRng(42);
    const b = seededRng(42);
    for (let i = 0; i < 20; i++) expect(rollDice(a)).toEqual(rollDice(b));
  });

  it("hits every face over many rolls", () => {
    const rng = seededRng(3);
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      const d = rollDice(rng);
      seen.add(`${d.red}-${d.yellow}`);
    }
    expect(seen.size).toBe(36);
  });
});

describe("balanced deck", () => {
  it("holds exactly one card per die combination", () => {
    expect(ALL_COMBINATIONS).toHaveLength(DECK_SIZE);
    const keys = new Set(ALL_COMBINATIONS.map((c) => `${c.red}-${c.yellow}`));
    expect(keys.size).toBe(36);
  });

  it("total distribution matches 2d6 exactly", () => {
    const counts = actualCounts(ALL_COMBINATIONS.map(diceTotal));
    for (const t of DICE_TOTALS) expect(counts[t]).toBe(DICE_WAYS[t]);
  });

  it("a fresh deck is a permutation of all combinations", () => {
    const deck = newDeck(seededRng(1));
    expect(deck.drawn).toBe(0);
    expect(deckRemaining(deck)).toBe(36);
    const keys = new Set(deck.cards.map((c) => `${c.red}-${c.yellow}`));
    expect(keys.size).toBe(36);
  });

  it("never repeats a card before the reshuffle point", () => {
    const rng = seededRng(11);
    let deck = newDeck(rng);
    const seen = new Set<string>();
    let draws = 0;
    let reshuffled = false;
    while (!reshuffled) {
      const r = drawCard(deck, rng);
      const key = `${r.card.red}-${r.card.yellow}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      deck = r.deck;
      draws++;
      reshuffled = r.reshuffled;
    }
    // 36 cards, reshuffle fires when 5 remain, so the 31st draw triggers it.
    expect(draws).toBe(DECK_SIZE - DECK_RESHUFFLE_AT);
    expect(deckRemaining(deck)).toBe(36);
  });

  it("reshuffles exactly when 5 cards would remain", () => {
    const rng = seededRng(5);
    let deck = newDeck(rng);
    for (let i = 0; i < 30; i++) {
      const r = drawCard(deck, rng);
      expect(r.reshuffled).toBe(false);
      deck = r.deck;
    }
    expect(deckRemaining(deck)).toBe(6);
    const r = drawCard(deck, rng);
    expect(r.reshuffled).toBe(true);
    expect(deckRemaining(r.deck)).toBe(36);
  });

  it("reports remaining totals that shrink as cards leave", () => {
    const rng = seededRng(9);
    let deck = newDeck(rng);
    const before = remainingTotals(deck);
    expect(Object.values(before).reduce((a, b) => a + b, 0)).toBe(36);
    const r = drawCard(deck, rng);
    deck = r.deck;
    const after = remainingTotals(deck);
    expect(after[r.card.red + r.card.yellow]).toBe(before[r.card.red + r.card.yellow] - 1);
    expect(Object.values(after).reduce((a, b) => a + b, 0)).toBe(35);
  });

  it("gives probabilities from the visible remainder", () => {
    const deck = newDeck(seededRng(2));
    expect(deckProbability(deck, 7)).toBeCloseTo(6 / 36, 10);
    expect(deckProbability(deck, 2)).toBeCloseTo(1 / 36, 10);
    const empty = { cards: deck.cards, drawn: 36 };
    expect(deckProbability(empty, 7)).toBe(0);
  });
});

describe("histogram helpers", () => {
  it("expected counts scale with n and sum to n", () => {
    const e = expectedCounts(36);
    expect(e[7]).toBe(6);
    expect(e[2]).toBe(1);
    expect(Object.values(e).reduce((a, b) => a + b, 0)).toBeCloseTo(36, 10);
    expect(expectedCounts(72)[8]).toBe(10);
  });

  it("actual counts ignore impossible totals", () => {
    const a = actualCounts([7, 7, 2, 13, 1]);
    expect(a[7]).toBe(2);
    expect(a[2]).toBe(1);
    expect(Object.values(a).reduce((x, y) => x + y, 0)).toBe(3);
  });
});
