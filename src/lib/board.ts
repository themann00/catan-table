import { boardGeometry, spiralOrder, type BoardGeometry } from "./board-geometry";
import type { Spot } from "./odds";
import { cryptoRng, randomInt, randomSeed, seedFromString, seedToString, seededRng, shuffle, type Rng } from "./rng";
import {
  RED_NUMBERS,
  RESOURCES,
  RULE_SETS,
  TERRAINS,
  TERRAIN_RESOURCE,
  TOKEN_NUMBERS,
  pipsFor,
  type Harbor,
  type Resource,
  type RuleSet,
  type RuleSetId,
  type Terrain,
} from "./rules";
import { isArrayOf, isBoolean, isNumber, isOneOf, isRecord } from "./storage";

/**
 * Board generator. Two modes:
 *
 *  random    Official variable set-up [1]: shuffle the land hexes, place the
 *            harbor markers at random on the frame, and lay the number tokens
 *            along a spiral from a corner inward, skipping the desert. The
 *            base game's token order (A-R = 5,2,6,3,8,10,9,12,11,4,8,10,9,4,
 *            5,6,3,11) is what keeps 6 and 8 apart. The 5-6 extension has its
 *            own lettered tokens [2]; here the same "no adjacent red numbers"
 *            property is enforced directly instead of copying that sequence.
 *  balanced  Same components, but terrain is shuffled until no two hexes of
 *            one resource touch, tokens are drawn from many candidate
 *            placements to even out pips per resource, and 2:1 harbors avoid
 *            sitting on a strong hex of their own resource.
 *
 * Both modes guarantee: 6 and 8 never adjacent to each other or another
 * 6/8, the desert carries no token, and harbors sit on coastal edges with
 * the rule set's exact harbor mix.
 *
 * [1] CATAN base rules (2015), Almanac "Set-up, Variable" and the token
 *     letters printed on the base tokens.
 * [2] CATAN 5-6 Player Extension rules: "Place the number token labeled A on
 *     any of the corner tiles. Continue placing the tokens in alphabetical
 *     order along a spiral, starting on the outside ring and proceeding
 *     counter-clockwise toward the center of the board... When the chain of
 *     tokens reaches a desert hex, skip over that hex."
 */
export type SetupMode = "random" | "balanced";
export const isSetupMode = (v: unknown): v is SetupMode => v === "random" || v === "balanced";

export const SPIRAL_TOKENS_BASE: readonly number[] = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

export interface BoardHex {
  terrain: Terrain;
  /** Production number, null on the desert. */
  token: number | null;
  locked: boolean;
}

export interface BoardHarbor {
  /** Index into geometry.coastalEdges. */
  edge: number;
  harbor: Harbor;
}

export interface Board {
  layout: RuleSetId;
  mode: SetupMode;
  seed: number;
  hexes: BoardHex[];
  harbors: BoardHarbor[];
}

export const rulesForBoard = (board: Board): RuleSet => RULE_SETS[board.layout];
export const geometryForBoard = (board: Board): BoardGeometry => boardGeometry(RULE_SETS[board.layout]);

const isRed = (n: number | null): boolean => n !== null && RED_NUMBERS.includes(n);

/* ------------------------------------------------------------------ */
/* Constraint checks                                                   */
/* ------------------------------------------------------------------ */

/** Pairs of adjacent hexes that both carry a red number. */
export function redAdjacencies(hexes: readonly BoardHex[], geometry: BoardGeometry): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  hexes.forEach((h, i) => {
    if (!isRed(h.token)) return;
    for (const n of geometry.neighbors[i]) if (n > i && isRed(hexes[n].token)) out.push([i, n]);
  });
  return out;
}

/** Adjacent hexes producing the same resource (deserts count as a pair too). */
export function sameResourceAdjacencies(hexes: readonly BoardHex[], geometry: BoardGeometry): number {
  let count = 0;
  hexes.forEach((h, i) => {
    for (const n of geometry.neighbors[i]) if (n > i && hexes[n].terrain === h.terrain) count++;
  });
  return count;
}

export function sameNumberAdjacencies(hexes: readonly BoardHex[], geometry: BoardGeometry): number {
  let count = 0;
  hexes.forEach((h, i) => {
    if (h.token === null) return;
    for (const n of geometry.neighbors[i]) if (n > i && hexes[n].token === h.token) count++;
  });
  return count;
}

/** Total pips per resource. */
export function pipsByResource(hexes: readonly BoardHex[]): Record<Resource, number> {
  const out = Object.fromEntries(RESOURCES.map((r) => [r, 0])) as Record<Resource, number>;
  for (const h of hexes) {
    const r = TERRAIN_RESOURCE[h.terrain];
    if (r && h.token !== null) out[r] += pipsFor(h.token);
  }
  return out;
}

/** 2:1 harbors that touch a hex of their own resource carrying 4+ pips. */
export function harborMismatches(board: Board, geometry: BoardGeometry): number {
  let count = 0;
  for (const { edge, harbor } of board.harbors) {
    if (harbor.kind !== "resource") continue;
    const e = geometry.coastalEdges[edge];
    const touching = new Set([...geometry.corners[e.cornerA].hexes, ...geometry.corners[e.cornerB].hexes]);
    for (const i of touching) {
      const h = board.hexes[i];
      if (TERRAIN_RESOURCE[h.terrain] === harbor.resource && h.token !== null && pipsFor(h.token) >= 4) count++;
    }
  }
  return count;
}

export interface BalanceReport {
  score: number;
  pips: Record<Resource, number>;
  /** Average pips per hex of each resource; the balanced generator evens these out. */
  pipsPerHex: Record<Resource, number>;
  sameResourcePairs: number;
  sameNumberPairs: number;
  redPairs: number;
  harborMismatches: number;
}

/** 0-100. Pip spread across resources dominates; clusters and repeats subtract. */
export function balanceReport(board: Board): BalanceReport {
  const geometry = geometryForBoard(board);
  const rules = rulesForBoard(board);
  const pips = pipsByResource(board.hexes);
  const pipsPerHex = Object.fromEntries(
    RESOURCES.map((r) => {
      const hexCount = rules.terrainCounts[TERRAINS.find((t) => TERRAIN_RESOURCE[t] === r)!];
      return [r, hexCount ? pips[r] / hexCount : 0];
    }),
  ) as Record<Resource, number>;
  const land = board.hexes.filter((h) => h.token !== null).length;
  const ideal = land ? board.hexes.reduce((s, h) => s + (h.token !== null ? pipsFor(h.token) : 0), 0) / land : 0;
  const spread = ideal ? RESOURCES.reduce((s, r) => s + Math.abs(pipsPerHex[r] - ideal), 0) / (RESOURCES.length * ideal) : 0;
  const sameResourcePairs = sameResourceAdjacencies(board.hexes, geometry);
  const sameNumberPairs = sameNumberAdjacencies(board.hexes, geometry);
  const redPairs = redAdjacencies(board.hexes, geometry).length;
  const mismatches = harborMismatches(board, geometry);
  const score = Math.max(0, Math.min(100, Math.round(100 - spread * 120 - sameResourcePairs * 6 - sameNumberPairs * 4 - redPairs * 100 - mismatches * 5)));
  return { score, pips, pipsPerHex, sameResourcePairs, sameNumberPairs, redPairs, harborMismatches: mismatches };
}

/* ------------------------------------------------------------------ */
/* Placement                                                           */
/* ------------------------------------------------------------------ */

function terrainPool(rules: RuleSet, locked: readonly BoardHex[]): Terrain[] {
  const pool: Terrain[] = [];
  for (const t of TERRAINS) {
    const used = locked.filter((h) => h.locked && h.terrain === t).length;
    for (let i = 0; i < rules.terrainCounts[t] - used; i++) pool.push(t);
  }
  return pool;
}

function tokenPool(rules: RuleSet, locked: readonly BoardHex[]): number[] {
  const pool = [...rules.numberTokens];
  for (const h of locked) {
    if (!h.locked || h.token === null) continue;
    const i = pool.indexOf(h.token);
    if (i >= 0) pool.splice(i, 1);
  }
  return pool;
}

/**
 * Assign terrain to unlocked hexes. Balanced mode shuffles, then swaps the
 * terrain of clustered hexes with others until no two alike touch, keeping
 * the best attempt if the locks make zero clusters impossible.
 */
function placeTerrain(previous: readonly BoardHex[], rules: RuleSet, geometry: BoardGeometry, mode: SetupMode, rng: Rng): BoardHex[] {
  const pool = terrainPool(rules, previous);
  const free = previous.map((h, i) => (h.locked ? -1 : i)).filter((i) => i >= 0);
  const attempts = mode === "balanced" ? 30 : 1;
  let best: BoardHex[] | null = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const shuffled = shuffle(pool, rng);
    let k = 0;
    const hexes: BoardHex[] = previous.map((h) => (h.locked ? { ...h } : { terrain: shuffled[k++], token: null, locked: false }));
    if (mode === "balanced") {
      for (let step = 0; step < 300; step++) {
        const clashes: number[] = [];
        hexes.forEach((h, i) => {
          if (!h.locked && geometry.neighbors[i].some((n) => hexes[n].terrain === h.terrain)) clashes.push(i);
        });
        if (clashes.length === 0) break;
        const victim = clashes[randomInt(rng, clashes.length)];
        // Swap with a free hex whose terrain would not clash in either place.
        const candidates = free.filter(
          (s) =>
            s !== victim &&
            hexes[s].terrain !== hexes[victim].terrain &&
            !geometry.neighbors[s].some((n) => n !== victim && hexes[n].terrain === hexes[victim].terrain) &&
            !geometry.neighbors[victim].some((n) => n !== s && hexes[n].terrain === hexes[s].terrain),
        );
        if (candidates.length === 0) break;
        const target = candidates[randomInt(rng, candidates.length)];
        [hexes[victim].terrain, hexes[target].terrain] = [hexes[target].terrain, hexes[victim].terrain];
      }
    }
    const score = sameResourceAdjacencies(hexes, geometry);
    if (score < bestScore) {
      best = hexes;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best!;
}

/**
 * Random placement with repair: shuffle tokens onto unlocked land, then swap
 * red tokens away from each other until no two are adjacent. Returns null if
 * the locks make it impossible within the budget.
 */
function placeTokensConstrained(hexes: BoardHex[], rules: RuleSet, geometry: BoardGeometry, rng: Rng): BoardHex[] | null {
  const pool = tokenPool(rules, hexes);
  const slots = hexes.map((h, i) => (!h.locked && h.terrain !== "desert" ? i : -1)).filter((i) => i >= 0);
  for (let attempt = 0; attempt < 60; attempt++) {
    const tokens = shuffle(pool, rng);
    const out = hexes.map((h) => ({ ...h }));
    slots.forEach((i, k) => (out[i].token = tokens[k] ?? null));
    let ok = false;
    for (let step = 0; step < 400; step++) {
      const bad = redAdjacencies(out, geometry);
      if (bad.length === 0) {
        ok = true;
        break;
      }
      const [a, b] = bad[randomInt(rng, bad.length)];
      const victim = !out[a].locked ? a : !out[b].locked ? b : -1;
      if (victim < 0) break;
      // Swap the red token with a non-red slot that has no red neighbors.
      const candidates = slots.filter((s) => s !== victim && !isRed(out[s].token) && !geometry.neighbors[s].some((n) => isRed(out[n].token) && n !== victim));
      if (candidates.length === 0) break;
      const target = candidates[randomInt(rng, candidates.length)];
      [out[victim].token, out[target].token] = [out[target].token, out[victim].token];
    }
    if (ok) return out;
  }
  return null;
}

/** Official base-game spiral from corner `start`. Only valid without locks and for the base layout. */
function placeTokensSpiral(hexes: BoardHex[], geometry: BoardGeometry, start: number): BoardHex[] {
  const order = spiralOrder(geometry, start);
  const out = hexes.map((h) => ({ ...h, token: null as number | null }));
  let k = 0;
  for (const i of order) {
    if (out[i].terrain === "desert") continue;
    out[i].token = SPIRAL_TOKENS_BASE[k++] ?? null;
  }
  return out;
}

function placeHarbors(hexes: BoardHex[], rules: RuleSet, geometry: BoardGeometry, mode: SetupMode, rng: Rng): BoardHarbor[] {
  const edges = geometry.coastalEdges.length;
  const count = rules.harbors.length;
  const offset = randomInt(rng, edges);
  const positions = Array.from({ length: count }, (_, i) => (offset + Math.round((i * edges) / count)) % edges);
  const tries = mode === "balanced" ? 60 : 1;
  let best: BoardHarbor[] = [];
  let bestScore = Infinity;
  for (let t = 0; t < tries; t++) {
    const types = shuffle(rules.harbors, rng);
    const harbors = positions.map((edge, i) => ({ edge, harbor: types[i] }));
    const score = harborMismatches({ layout: rules.id, mode, seed: 0, hexes, harbors }, geometry);
    if (score < bestScore) {
      best = harbors;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface GenerateOptions {
  layout: RuleSetId;
  mode: SetupMode;
  seed?: number;
  /** Previous board whose locked hexes must be kept. */
  keep?: Board;
}

/** Fresh board or a reroll around locked hexes. Deterministic for a given seed and `keep`. */
export function generateBoard(options: GenerateOptions): Board {
  const seed = options.seed ?? randomSeed(cryptoRng);
  const rng = seededRng(seed);
  const rules = RULE_SETS[options.layout];
  const geometry = boardGeometry(rules);
  const hexCount = geometry.hexes.length;

  const previous: BoardHex[] =
    options.keep && options.keep.layout === options.layout
      ? options.keep.hexes.map((h) => ({ ...h }))
      : Array.from({ length: hexCount }, () => ({ terrain: "desert" as Terrain, token: null, locked: false }));
  const anyLocked = previous.some((h) => h.locked);

  const terrained = placeTerrain(previous, rules, geometry, options.mode, rng);

  let hexes: BoardHex[] | null = null;
  if (options.mode === "random" && !anyLocked && rules.id === "base") {
    hexes = placeTokensSpiral(terrained, geometry, randomInt(rng, 6));
    // The spiral keeps reds apart by design; fall through to repair if it ever does not.
    if (redAdjacencies(hexes, geometry).length > 0) hexes = null;
  }
  if (!hexes && options.mode === "balanced") {
    let bestScore = -Infinity;
    for (let t = 0; t < 40; t++) {
      const candidate = placeTokensConstrained(terrained, rules, geometry, rng);
      if (!candidate) continue;
      const harbors = placeHarbors(candidate, rules, geometry, "balanced", rng);
      const { score } = balanceReport({ layout: rules.id, mode: "balanced", seed, hexes: candidate, harbors });
      if (score > bestScore) {
        bestScore = score;
        hexes = candidate;
      }
      if (score >= 98) break;
    }
  }
  if (!hexes) hexes = placeTokensConstrained(terrained, rules, geometry, rng);
  if (!hexes) {
    // Locks made a legal board impossible: release them and try once more.
    const released = terrained.map((h) => ({ ...h, locked: false }));
    hexes = placeTokensConstrained(released, rules, geometry, rng) ?? released;
  }

  const harbors = placeHarbors(hexes, rules, geometry, options.mode, rng);
  return { layout: rules.id, mode: options.mode, seed, hexes, harbors };
}

export const toggleLock = (board: Board, index: number): Board => ({
  ...board,
  hexes: board.hexes.map((h, i) => (i === index ? { ...h, locked: !h.locked } : h)),
});

export const clearLocks = (board: Board): Board => ({ ...board, hexes: board.hexes.map((h) => ({ ...h, locked: false })) });

/** The settlement spot at a corner: every land hex touching it. */
export function spotAtCorner(board: Board, cornerId: number): Spot {
  const geometry = geometryForBoard(board);
  const corner = geometry.corners[cornerId];
  if (!corner) return { tokens: [] };
  const tokens = corner.hexes
    .map((i) => board.hexes[i])
    .filter((h) => h.token !== null && TERRAIN_RESOURCE[h.terrain] !== null)
    .map((h) => ({ number: h.token as number, resource: TERRAIN_RESOURCE[h.terrain] as Resource }));
  return { tokens };
}

/* ------------------------------------------------------------------ */
/* URL encoding                                                        */
/* ------------------------------------------------------------------ */

const TERRAIN_CODE: Record<Terrain, string> = { forest: "F", pasture: "P", fields: "G", hills: "H", mountains: "M", desert: "D" };
const CODE_TERRAIN: Record<string, Terrain> = Object.fromEntries(Object.entries(TERRAIN_CODE).map(([t, c]) => [c, t as Terrain]));
const TOKEN_CODE = "0123456789abc"; // token n -> TOKEN_CODE[n], 0 = none
const HARBOR_CODE: Record<string, string> = { generic: "3", lumber: "L", wool: "W", grain: "G", brick: "B", ore: "O" };
const CODE_HARBOR: Record<string, Harbor> = {
  "3": { kind: "generic" },
  L: { kind: "resource", resource: "lumber" },
  W: { kind: "resource", resource: "wool" },
  G: { kind: "resource", resource: "grain" },
  B: { kind: "resource", resource: "brick" },
  O: { kind: "resource", resource: "ore" },
};

/**
 * Compact, URL-safe: `<layout><mode><seed>.<hexes>.<harbors>`
 *   layout  B (base) or X (extension)
 *   mode    r or b
 *   seed    8 hex chars
 *   hexes   two chars each: terrain letter + token code (0 for none), locked hexes lower-case
 *   harbors two chars each: edge index as two base-36 digits, then the harbor code
 */
export function encodeBoard(board: Board): string {
  const head = `${board.layout === "base" ? "B" : "X"}${board.mode === "random" ? "r" : "b"}${seedToString(board.seed)}`;
  const hexes = board.hexes
    .map((h) => {
      const t = TERRAIN_CODE[h.terrain];
      return `${h.locked ? t.toLowerCase() : t}${TOKEN_CODE[h.token ?? 0]}`;
    })
    .join("");
  const harbors = board.harbors.map((h) => `${h.edge.toString(36).padStart(2, "0")}${HARBOR_CODE[h.harbor.kind === "generic" ? "generic" : h.harbor.resource]}`).join("");
  return `${head}.${hexes}.${harbors}`;
}

export function decodeBoard(text: string): Board | null {
  const m = /^([BX])([rb])([0-9a-fA-F]{8})\.([A-Za-z0-9]*)\.([0-9a-z3LWGBO]*)$/.exec(text.trim());
  if (!m) return null;
  const layout: RuleSetId = m[1] === "B" ? "base" : "extension56";
  const mode: SetupMode = m[2] === "r" ? "random" : "balanced";
  const seed = seedFromString(m[3]);
  if (seed === null) return null;
  const rules = RULE_SETS[layout];
  const geometry = boardGeometry(rules);
  const hexText = m[4];
  if (hexText.length !== geometry.hexes.length * 2) return null;
  const hexes: BoardHex[] = [];
  for (let i = 0; i < hexText.length; i += 2) {
    const tChar = hexText[i];
    const terrain = CODE_TERRAIN[tChar.toUpperCase()];
    const tokenIdx = TOKEN_CODE.indexOf(hexText[i + 1]);
    if (!terrain || tokenIdx < 0) return null;
    const token = tokenIdx === 0 ? null : tokenIdx;
    if (token !== null && !TOKEN_NUMBERS.includes(token)) return null;
    if ((terrain === "desert") !== (token === null)) return null;
    hexes.push({ terrain, token, locked: tChar === tChar.toLowerCase() });
  }
  const harborText = m[5];
  if (harborText.length !== rules.harbors.length * 3) return null;
  const harbors: BoardHarbor[] = [];
  for (let i = 0; i < harborText.length; i += 3) {
    const edge = parseInt(harborText.slice(i, i + 2), 36);
    const harbor = CODE_HARBOR[harborText[i + 2]];
    if (!Number.isFinite(edge) || edge < 0 || edge >= geometry.coastalEdges.length || !harbor) return null;
    harbors.push({ edge, harbor });
  }
  const board: Board = { layout, mode, seed, hexes, harbors };
  return isBoard(board) ? board : null;
}

/* Validators for persistence. */
const isBoardHex = (v: unknown): v is BoardHex =>
  isRecord(v) &&
  isOneOf(TERRAINS)(v.terrain) &&
  (v.token === null || (isNumber(v.token) && TOKEN_NUMBERS.includes(v.token))) &&
  isBoolean(v.locked) &&
  (v.terrain === "desert") === (v.token === null);

const isHarbor = (v: unknown): v is Harbor =>
  isRecord(v) && (v.kind === "generic" || (v.kind === "resource" && isOneOf(RESOURCES)(v.resource)));

const isBoardHarbor = (v: unknown): v is BoardHarbor => isRecord(v) && isNumber(v.edge) && isHarbor(v.harbor);

export function isBoard(v: unknown): v is Board {
  if (!isRecord(v)) return false;
  if (!isOneOf(["base", "extension56"] as const)(v.layout) || !isSetupMode(v.mode) || !isNumber(v.seed)) return false;
  if (!isArrayOf(isBoardHex)(v.hexes) || !isArrayOf(isBoardHarbor)(v.harbors)) return false;
  const rules = RULE_SETS[v.layout];
  const geometry = boardGeometry(rules);
  if (v.hexes.length !== geometry.hexes.length) return false;
  if (v.harbors.length !== rules.harbors.length) return false;
  return v.harbors.every((h) => h.edge >= 0 && h.edge < geometry.coastalEdges.length);
}
