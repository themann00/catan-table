import { describe, expect, it } from "vitest";
import { boardGeometry, spiralOrder } from "./board-geometry";
import {
  SPIRAL_TOKENS_BASE,
  balanceReport,
  decodeBoard,
  encodeBoard,
  generateBoard,
  isBoard,
  redAdjacencies,
  sameResourceAdjacencies,
  spotAtCorner,
  toggleLock,
  type Board,
} from "./board";
import { BASE_RULES, EXTENSION_56_RULES, RULE_SETS, TERRAINS, pipsFor, type RuleSetId } from "./rules";

const countBy = <T>(items: readonly T[]): Map<T, number> => {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return m;
};

describe("geometry", () => {
  it("lays out 19 and 30 hexes", () => {
    expect(boardGeometry(BASE_RULES).hexes).toHaveLength(19);
    expect(boardGeometry(EXTENSION_56_RULES).hexes).toHaveLength(30);
  });

  it("finds 54 intersections and 30 coastal edges on the base board", () => {
    const g = boardGeometry(BASE_RULES);
    expect(g.corners).toHaveLength(54);
    expect(g.coastalEdges).toHaveLength(30);
    // The centre hex touches six others; corner hexes touch three.
    expect(g.neighbors[9]).toHaveLength(6);
    expect(g.neighbors[0]).toHaveLength(3);
    // Each corner touches at most three hexes.
    expect(Math.max(...g.corners.map((c) => c.hexes.length))).toBe(3);
  });

  it("finds 80 intersections on the extension board", () => {
    const g = boardGeometry(EXTENSION_56_RULES);
    expect(g.corners).toHaveLength(80);
    // The elongated island peels into 16 outer, 10 middle, and a 4-hex core.
    expect(g.rings.map((r) => r.length)).toEqual([16, 10, 4]);
    expect(g.rings.flat()).toHaveLength(30);
  });

  it("orders coastal edges so consecutive edges share a corner", () => {
    const g = boardGeometry(BASE_RULES);
    for (let i = 0; i < g.coastalEdges.length; i++) {
      const a = g.coastalEdges[i];
      const b = g.coastalEdges[(i + 1) % g.coastalEdges.length];
      const shared = [a.cornerA, a.cornerB].filter((c) => c === b.cornerA || c === b.cornerB);
      expect(shared).toHaveLength(1);
    }
  });

  it("builds rings 12-6-1 and a spiral that visits every hex once", () => {
    const g = boardGeometry(BASE_RULES);
    expect(g.rings.map((r) => r.length)).toEqual([12, 6, 1]);
    for (let start = 0; start < 6; start++) {
      const order = spiralOrder(g, start);
      expect(new Set(order).size).toBe(19);
      expect(g.neighbors[order[0]]).toHaveLength(3);
      // Consecutive outer-ring hexes are neighbours.
      for (let i = 0; i < 11; i++) expect(g.neighbors[order[i]]).toContain(order[i + 1]);
    }
  });
});

describe("official spiral tokens", () => {
  it("is the 18 base tokens", () => {
    expect(SPIRAL_TOKENS_BASE).toHaveLength(18);
    expect([...SPIRAL_TOKENS_BASE].sort((a, b) => a - b)).toEqual([...BASE_RULES.numberTokens].sort((a, b) => a - b));
  });
});

const checkComponents = (board: Board) => {
  const rules = RULE_SETS[board.layout];
  const geometry = boardGeometry(rules);
  const terrains = countBy(board.hexes.map((h) => h.terrain));
  for (const t of TERRAINS) expect(terrains.get(t) ?? 0).toBe(rules.terrainCounts[t]);
  const tokens = board.hexes.filter((h) => h.token !== null).map((h) => h.token as number);
  expect([...tokens].sort((a, b) => a - b)).toEqual([...rules.numberTokens].sort((a, b) => a - b));
  for (const h of board.hexes) expect(h.token === null).toBe(h.terrain === "desert");
  expect(redAdjacencies(board.hexes, geometry)).toHaveLength(0);
  expect(board.harbors).toHaveLength(rules.harbors.length);
  const generic = board.harbors.filter((h) => h.harbor.kind === "generic").length;
  expect(generic).toBe(rules.harbors.filter((h) => h.kind === "generic").length);
  const edges = new Set(board.harbors.map((h) => h.edge));
  expect(edges.size).toBe(board.harbors.length);
  for (const e of edges) expect(e).toBeLessThan(geometry.coastalEdges.length);
};

describe.each<[RuleSetId, "random" | "balanced"]>([
  ["base", "random"],
  ["base", "balanced"],
  ["extension56", "random"],
  ["extension56", "balanced"],
])("generateBoard %s %s", (layout, mode) => {
  it("keeps every constraint across 500 seeds", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const board = generateBoard({ layout, mode, seed });
      checkComponents(board);
      expect(board.seed).toBe(seed);
    }
  });

  it("is deterministic for a seed", () => {
    expect(generateBoard({ layout, mode, seed: 4242 })).toEqual(generateBoard({ layout, mode, seed: 4242 }));
    expect(generateBoard({ layout, mode, seed: 1 })).not.toEqual(generateBoard({ layout, mode, seed: 2 }));
  });
});

describe("balanced mode", () => {
  it("removes same-resource clusters on the base board", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const board = generateBoard({ layout: "base", mode: "balanced", seed });
      expect(sameResourceAdjacencies(board.hexes, boardGeometry(BASE_RULES))).toBe(0);
    }
  });

  it("scores higher than random on average", () => {
    let random = 0;
    let balanced = 0;
    for (let seed = 1; seed <= 40; seed++) {
      random += balanceReport(generateBoard({ layout: "base", mode: "random", seed })).score;
      balanced += balanceReport(generateBoard({ layout: "base", mode: "balanced", seed })).score;
    }
    expect(balanced / 40).toBeGreaterThan(random / 40);
    expect(balanced / 40).toBeGreaterThan(80);
  });

  it("reports pips per resource that sum to the board total", () => {
    const board = generateBoard({ layout: "base", mode: "balanced", seed: 7 });
    const report = balanceReport(board);
    const total = board.hexes.reduce((s, h) => s + (h.token !== null ? pipsFor(h.token) : 0), 0);
    expect(Object.values(report.pips).reduce((a, b) => a + b, 0)).toBe(total);
    expect(total).toBe(58);
    expect(report.redPairs).toBe(0);
  });
});

describe("locks", () => {
  it("keeps locked hexes and rerolls the rest with valid components", () => {
    const first = generateBoard({ layout: "base", mode: "random", seed: 11 });
    let locked = first;
    for (const i of [0, 4, 9, 13]) locked = toggleLock(locked, i);
    for (let seed = 100; seed < 130; seed++) {
      const next = generateBoard({ layout: "base", mode: seed % 2 ? "random" : "balanced", seed, keep: locked });
      for (const i of [0, 4, 9, 13]) {
        expect(next.hexes[i].terrain).toBe(first.hexes[i].terrain);
        expect(next.hexes[i].token).toBe(first.hexes[i].token);
        expect(next.hexes[i].locked).toBe(true);
      }
      checkComponents(next);
    }
  });

  it("survives locking two red hexes far apart", () => {
    const first = generateBoard({ layout: "base", mode: "random", seed: 3 });
    const reds = first.hexes.map((h, i) => (h.token === 6 || h.token === 8 ? i : -1)).filter((i) => i >= 0);
    let locked = first;
    for (const i of reds) locked = toggleLock(locked, i);
    const next = generateBoard({ layout: "base", mode: "balanced", seed: 99, keep: locked });
    checkComponents(next);
  });
});

describe("spots from the board", () => {
  it("returns the land hexes touching a corner", () => {
    const board = generateBoard({ layout: "base", mode: "random", seed: 5 });
    const g = boardGeometry(BASE_RULES);
    const inland = g.corners.find((c) => c.hexes.length === 3)!;
    const spot = spotAtCorner(board, inland.id);
    const deserts = inland.hexes.filter((i) => board.hexes[i].terrain === "desert").length;
    expect(spot.tokens).toHaveLength(3 - deserts);
    expect(spotAtCorner(board, 9999).tokens).toHaveLength(0);
  });
});

describe("encoding", () => {
  it("round-trips both layouts and keeps locks", () => {
    for (const layout of ["base", "extension56"] as const) {
      const board = toggleLock(generateBoard({ layout, mode: "balanced", seed: 77 }), 3);
      const text = encodeBoard(board);
      expect(text).toMatch(/^[BX][rb][0-9a-f]{8}\.[A-Za-z0-9]+\.[0-9a-z3LWGBO]+$/);
      expect(decodeBoard(text)).toEqual(board);
      expect(decodeBoard(encodeURIComponent(text) === text ? text : decodeURIComponent(text))).toEqual(board);
    }
  });

  it("rejects tampered strings", () => {
    const board = generateBoard({ layout: "base", mode: "random", seed: 8 });
    const text = encodeBoard(board);
    expect(decodeBoard(text.slice(0, -1))).toBeNull();
    // Header is 10 chars plus the dot, so index 11 is the first terrain letter.
    expect(decodeBoard(`${text.slice(0, 11)}Z${text.slice(12)}`)).toBeNull();
    // A desert with a token, or a token hex without one, is invalid.
    expect(decodeBoard(`${text.slice(0, 11)}D5${text.slice(13)}`)).toBeNull();
    expect(decodeBoard("nonsense")).toBeNull();
    expect(isBoard({ ...board, harbors: [] })).toBe(false);
    expect(isBoard(board)).toBe(true);
  });
});
