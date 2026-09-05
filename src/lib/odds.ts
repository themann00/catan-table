import { DICE_TOTALS, DICE_TOTAL_WAYS, DICE_WAYS, RESOURCES, TOKEN_NUMBERS, pipsFor, type Resource } from "./rules";
import { isArrayOf, isNumber, isOneOf, isRecord } from "./storage";

/**
 * Settlement spot odds. A spot touches up to three hexes, each with a
 * number token and a resource. One roll matches at most one total, so the
 * chance the spot produces is the sum of ways over its *distinct* numbers,
 * while expected cards count every token (two 5s pay twice on a 5).
 */
export interface SpotToken {
  number: number;
  resource: Resource;
}

export interface Spot {
  tokens: SpotToken[];
}

export const MAX_SPOT_TOKENS = 3;

export const emptySpot = (): Spot => ({ tokens: [] });

/** Probability a single roll shows `total`. */
export const rollProbability = (total: number): number => (DICE_WAYS[total] ?? 0) / DICE_TOTAL_WAYS;

/** Sum of pips printed on the spot's tokens. */
export const spotPips = (spot: Spot): number => spot.tokens.reduce((sum, t) => sum + pipsFor(t.number), 0);

/** Chance the spot yields at least one card on a roll. */
export function spotHitProbability(spot: Spot): number {
  const distinct = new Set(spot.tokens.map((t) => t.number));
  let ways = 0;
  for (const n of distinct) ways += DICE_WAYS[n] ?? 0;
  return ways / DICE_TOTAL_WAYS;
}

/** Expected cards per roll for a settlement (cities double it). */
export const expectedCardsPerRoll = (spot: Spot, multiplier = 1): number =>
  (multiplier * spot.tokens.reduce((sum, t) => sum + (DICE_WAYS[t.number] ?? 0), 0)) / DICE_TOTAL_WAYS;

export const expectedCardsInTurns = (spot: Spot, turns: number, multiplier = 1): number =>
  expectedCardsPerRoll(spot, multiplier) * Math.max(0, turns);

/** Chance of at least one card over `turns` independent rolls. */
export const probabilityAtLeastOneIn = (spot: Spot, turns: number): number => {
  if (turns <= 0) return 0;
  const miss = 1 - spotHitProbability(spot);
  return 1 - Math.pow(miss, turns);
};

/** Share of expected production per resource, summing to 1 (all zeros for an empty spot). */
export function resourceMix(spot: Spot): Record<Resource, number> {
  const out = Object.fromEntries(RESOURCES.map((r) => [r, 0])) as Record<Resource, number>;
  const total = spot.tokens.reduce((sum, t) => sum + (DICE_WAYS[t.number] ?? 0), 0);
  if (total === 0) return out;
  for (const t of spot.tokens) out[t.resource] += (DICE_WAYS[t.number] ?? 0) / total;
  return out;
}

/** Fraction of combined expected production that belongs to spot A. 0.5 when both are empty. */
export function compareShare(a: Spot, b: Spot): number {
  const ea = expectedCardsPerRoll(a);
  const eb = expectedCardsPerRoll(b);
  if (ea + eb === 0) return 0.5;
  return ea / (ea + eb);
}

export interface ReferenceRow {
  total: number;
  ways: number;
  probability: number;
  pips: number;
}

/** 2-12 reference: ways out of 36, probability, and token pips (7 has none). */
export const REFERENCE_TABLE: readonly ReferenceRow[] = DICE_TOTALS.map((total) => ({
  total,
  ways: DICE_WAYS[total],
  probability: rollProbability(total),
  pips: pipsFor(total),
}));

/* Validators for persisted spots. */
const isSpotToken = (v: unknown): v is SpotToken =>
  isRecord(v) && isNumber(v.number) && TOKEN_NUMBERS.includes(v.number) && isOneOf(RESOURCES)(v.resource);

export const isSpot = (v: unknown): v is Spot => isRecord(v) && isArrayOf(isSpotToken)(v.tokens) && v.tokens.length <= MAX_SPOT_TOKENS;
