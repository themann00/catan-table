import { describe, expect, it } from "vitest";
import { canDraw, nextCardOdds, remainingDeck } from "./dev-cards";
import { BASE_RULES, EXTENSION_56_RULES, devDeckSize } from "./rules";

describe("dev card tracker", () => {
  it("starts with the full deck odds", () => {
    const odds = nextCardOdds(BASE_RULES.devDeck);
    expect(odds.remaining).toBe(25);
    expect(odds.knight).toBeCloseTo(14 / 25, 10);
    expect(odds.victoryPoint).toBeCloseTo(5 / 25, 10);
    expect(odds.progress).toBeCloseTo(6 / 25, 10);
    expect(odds.knight + odds.victoryPoint + odds.progress).toBeCloseTo(1, 10);
  });

  it("removes drawn cards and updates odds", () => {
    const remaining = remainingDeck(BASE_RULES.devDeck, ["knight", "knight", "victoryPoint", "monopoly"]);
    expect(devDeckSize(remaining)).toBe(21);
    expect(remaining.knight).toBe(12);
    expect(remaining.victoryPoint).toBe(4);
    expect(remaining.monopoly).toBe(1);
    const odds = nextCardOdds(remaining);
    expect(odds.knight).toBeCloseTo(12 / 21, 10);
    expect(odds.victoryPoint).toBeCloseTo(4 / 21, 10);
    expect(odds.progress).toBeCloseTo(5 / 21, 10);
  });

  it("never goes negative and blocks impossible draws", () => {
    const drawn = Array<"monopoly">(5).fill("monopoly");
    const remaining = remainingDeck(BASE_RULES.devDeck, drawn);
    expect(remaining.monopoly).toBe(0);
    expect(canDraw(remaining, "monopoly")).toBe(false);
    expect(canDraw(remaining, "knight")).toBe(true);
  });

  it("handles an exhausted deck", () => {
    const remaining = remainingDeck(BASE_RULES.devDeck, [
      ...Array<"knight">(14).fill("knight"),
      ...Array<"victoryPoint">(5).fill("victoryPoint"),
      ...Array<"roadBuilding">(2).fill("roadBuilding"),
      ...Array<"yearOfPlenty">(2).fill("yearOfPlenty"),
      ...Array<"monopoly">(2).fill("monopoly"),
    ]);
    expect(devDeckSize(remaining)).toBe(0);
    expect(nextCardOdds(remaining)).toEqual({ knight: 0, victoryPoint: 0, progress: 0, remaining: 0 });
  });

  it("uses the 34 card deck for the extension", () => {
    const odds = nextCardOdds(EXTENSION_56_RULES.devDeck);
    expect(odds.remaining).toBe(34);
    expect(odds.knight).toBeCloseTo(20 / 34, 10);
    expect(odds.progress).toBeCloseTo(9 / 34, 10);
  });
});
