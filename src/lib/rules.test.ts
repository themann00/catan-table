import { describe, expect, it } from "vitest";
import {
  BASE_RULES,
  DICE_TOTALS,
  DICE_TOTAL_WAYS,
  DICE_WAYS,
  EXTENSION_56_RULES,
  RESOURCES,
  devDeckSize,
  hexCount,
  pipsFor,
  robberDiscardCount,
  ruleSetForPlayers,
} from "./rules";

describe("dice distribution", () => {
  it("covers all 36 combinations", () => {
    const total = DICE_TOTALS.reduce((sum, t) => sum + DICE_WAYS[t], 0);
    expect(total).toBe(DICE_TOTAL_WAYS);
  });

  it("is symmetric around 7", () => {
    for (const t of DICE_TOTALS) expect(DICE_WAYS[t]).toBe(DICE_WAYS[14 - t]);
  });

  it("gives pips equal to ways except for 7", () => {
    expect(pipsFor(6)).toBe(5);
    expect(pipsFor(2)).toBe(1);
    expect(pipsFor(7)).toBe(0);
    expect(pipsFor(13)).toBe(0);
  });
});

describe("base rules", () => {
  it("has 19 hexes matching the terrain counts", () => {
    expect(hexCount(BASE_RULES)).toBe(19);
    const terrainTotal = Object.values(BASE_RULES.terrainCounts).reduce((a, b) => a + b, 0);
    expect(terrainTotal).toBe(19);
  });

  it("has one token per producing hex, one 2 and one 12, no 7", () => {
    expect(BASE_RULES.numberTokens).toHaveLength(19 - BASE_RULES.terrainCounts.desert);
    expect(BASE_RULES.numberTokens.filter((n) => n === 2)).toHaveLength(1);
    expect(BASE_RULES.numberTokens.filter((n) => n === 12)).toHaveLength(1);
    expect(BASE_RULES.numberTokens).not.toContain(7);
  });

  it("has 9 harbors: 4 generic and one per resource", () => {
    expect(BASE_RULES.harbors).toHaveLength(9);
    expect(BASE_RULES.harbors.filter((h) => h.kind === "generic")).toHaveLength(4);
    for (const r of RESOURCES) {
      expect(BASE_RULES.harbors.filter((h) => h.kind === "resource" && h.resource === r)).toHaveLength(1);
    }
  });

  it("has a 25 card development deck", () => {
    expect(devDeckSize(BASE_RULES.devDeck)).toBe(25);
    expect(BASE_RULES.devDeck.knight).toBe(14);
    expect(BASE_RULES.devDeck.victoryPoint).toBe(5);
  });
});

describe("5-6 extension rules", () => {
  it("has 30 hexes matching the terrain counts", () => {
    expect(hexCount(EXTENSION_56_RULES)).toBe(30);
    const terrainTotal = Object.values(EXTENSION_56_RULES.terrainCounts).reduce((a, b) => a + b, 0);
    expect(terrainTotal).toBe(30);
  });

  it("has 28 tokens, one per producing hex", () => {
    expect(EXTENSION_56_RULES.numberTokens).toHaveLength(28);
    expect(EXTENSION_56_RULES.numberTokens).toHaveLength(30 - EXTENSION_56_RULES.terrainCounts.desert);
    expect(EXTENSION_56_RULES.numberTokens.filter((n) => n === 2)).toHaveLength(2);
    expect(EXTENSION_56_RULES.numberTokens.filter((n) => n === 8)).toHaveLength(3);
  });

  it("adds one generic and one wool harbor for 11 total", () => {
    expect(EXTENSION_56_RULES.harbors).toHaveLength(11);
    expect(EXTENSION_56_RULES.harbors.filter((h) => h.kind === "generic")).toHaveLength(5);
    expect(
      EXTENSION_56_RULES.harbors.filter((h) => h.kind === "resource" && h.resource === "wool"),
    ).toHaveLength(2);
  });

  it("has a 34 card development deck", () => {
    expect(devDeckSize(EXTENSION_56_RULES.devDeck)).toBe(34);
    expect(EXTENSION_56_RULES.devDeck.knight).toBe(20);
    expect(EXTENSION_56_RULES.devDeck.monopoly).toBe(3);
  });

  it("is selected for 5 or 6 players", () => {
    expect(ruleSetForPlayers(3).id).toBe("base");
    expect(ruleSetForPlayers(4).id).toBe("base");
    expect(ruleSetForPlayers(5).id).toBe("extension56");
    expect(ruleSetForPlayers(6).id).toBe("extension56");
  });
});

describe("robber discard", () => {
  it("applies only above 7 cards and rounds down", () => {
    expect(robberDiscardCount(7)).toBe(0);
    expect(robberDiscardCount(8)).toBe(4);
    expect(robberDiscardCount(9)).toBe(4);
    expect(robberDiscardCount(11)).toBe(5);
  });
});
