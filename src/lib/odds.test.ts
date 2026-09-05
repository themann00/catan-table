import { describe, expect, it } from "vitest";
import {
  REFERENCE_TABLE,
  compareShare,
  emptySpot,
  expectedCardsInTurns,
  expectedCardsPerRoll,
  isSpot,
  probabilityAtLeastOneIn,
  resourceMix,
  rollProbability,
  spotHitProbability,
  spotPips,
  type Spot,
} from "./odds";

const spot = (...pairs: Array<[number, Spot["tokens"][number]["resource"]]>): Spot => ({
  tokens: pairs.map(([number, resource]) => ({ number, resource })),
});

describe("spot odds, hand computed", () => {
  // 6 (5 ways) + 8 (5 ways) + 5 (4 ways) = 14 ways of 36.
  const strong = spot([6, "wool"], [8, "ore"], [5, "grain"]);

  it("sums pips", () => {
    expect(spotPips(strong)).toBe(14);
    expect(spotPips(spot([2, "brick"], [12, "lumber"]))).toBe(2);
    expect(spotPips(emptySpot())).toBe(0);
  });

  it("gives the per-roll hit chance", () => {
    expect(spotHitProbability(strong)).toBeCloseTo(14 / 36, 12);
    expect(spotHitProbability(spot([2, "brick"]))).toBeCloseTo(1 / 36, 12);
    expect(spotHitProbability(emptySpot())).toBe(0);
  });

  it("counts a duplicated number once for hit chance but twice for cards", () => {
    const twoFives = spot([5, "grain"], [5, "lumber"]);
    expect(spotHitProbability(twoFives)).toBeCloseTo(4 / 36, 12);
    expect(expectedCardsPerRoll(twoFives)).toBeCloseTo(8 / 36, 12);
  });

  it("expected cards per 10 turns is 10 times pips over 36", () => {
    expect(expectedCardsInTurns(strong, 10)).toBeCloseTo(140 / 36, 12);
    expect(expectedCardsInTurns(strong, 10, 2)).toBeCloseTo(280 / 36, 12);
    expect(expectedCardsInTurns(strong, 0)).toBe(0);
    expect(expectedCardsInTurns(strong, -3)).toBe(0);
  });

  it("chance of at least one card in N turns is 1 minus miss^N", () => {
    expect(probabilityAtLeastOneIn(strong, 1)).toBeCloseTo(14 / 36, 12);
    expect(probabilityAtLeastOneIn(strong, 10)).toBeCloseTo(1 - Math.pow(22 / 36, 10), 12);
    expect(probabilityAtLeastOneIn(strong, 10)).toBeCloseTo(0.99278, 4);
    expect(probabilityAtLeastOneIn(emptySpot(), 10)).toBe(0);
    expect(probabilityAtLeastOneIn(strong, 0)).toBe(0);
  });

  it("splits the resource mix by production weight", () => {
    const mix = resourceMix(strong);
    expect(mix.wool).toBeCloseTo(5 / 14, 12);
    expect(mix.ore).toBeCloseTo(5 / 14, 12);
    expect(mix.grain).toBeCloseTo(4 / 14, 12);
    expect(mix.brick).toBe(0);
    expect(Object.values(mix).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(Object.values(resourceMix(emptySpot())).every((v) => v === 0)).toBe(true);
  });

  it("compares two spots by expected production", () => {
    const weak = spot([2, "brick"], [12, "lumber"]);
    expect(compareShare(strong, weak)).toBeCloseTo(14 / 16, 12);
    expect(compareShare(weak, strong)).toBeCloseTo(2 / 16, 12);
    expect(compareShare(emptySpot(), emptySpot())).toBe(0.5);
  });
});

describe("reference table", () => {
  it("lists 2 through 12 with probabilities summing to 1", () => {
    expect(REFERENCE_TABLE.map((r) => r.total)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(REFERENCE_TABLE.reduce((s, r) => s + r.probability, 0)).toBeCloseTo(1, 12);
    expect(REFERENCE_TABLE.find((r) => r.total === 7)).toMatchObject({ ways: 6, pips: 0 });
    expect(REFERENCE_TABLE.find((r) => r.total === 8)).toMatchObject({ ways: 5, pips: 5 });
    expect(rollProbability(13)).toBe(0);
  });
});

describe("isSpot", () => {
  it("accepts valid spots and rejects sevens and overflow", () => {
    expect(isSpot({ tokens: [{ number: 6, resource: "ore" }] })).toBe(true);
    expect(isSpot({ tokens: [] })).toBe(true);
    expect(isSpot({ tokens: [{ number: 7, resource: "ore" }] })).toBe(false);
    expect(isSpot({ tokens: [{ number: 6, resource: "gold" }] })).toBe(false);
    expect(
      isSpot({
        tokens: [
          { number: 6, resource: "ore" },
          { number: 6, resource: "ore" },
          { number: 6, resource: "ore" },
          { number: 6, resource: "ore" },
        ],
      }),
    ).toBe(false);
  });
});
