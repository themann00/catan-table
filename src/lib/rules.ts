/**
 * Rules constants for Catan. Everything that varies by edition or expansion
 * lives here so Seafarers or Cities & Knights can be added as another RuleSet
 * without touching the engines.
 *
 * Sources, checked 2026-09-05:
 *  [1] CATAN base game rules (Catan Studio / Mayfair, 2015 edition, 2020 print):
 *      "Game Components: 19 terrain hexes, 6 sea frame pieces, 9 harbor pieces,
 *      18 circular number tokens, 95 resource cards, 25 development cards
 *      (14 knight cards, 6 progress cards, 5 victory point cards)".
 *      Almanac, Number Tokens: "The 18 number tokens are marked with the
 *      numerals 2 through 12. There is only one 2 and one 12. There is no 7."
 *      Special Cases, Rolling a 7: "every player who has more than 7 resource
 *      cards must select half (rounded down) of their resource cards and
 *      return them to the bank."
 *      https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf
 *  [2] CATAN 5-6 Player Extension rules (2015 edition): "11 terrain hexes
 *      (1 desert, 2 fields, 2 forest, 2 pasture, 2 mountains, 2 hills),
 *      4 small frame pieces (2 plain shore, 1 generic 3:1 harbor, 1 wool 2:1
 *      harbor), 9 development cards (6 knight cards, 1 Monopoly card,
 *      1 Year of Plenty card, 1 Road Building card), 28 circular number tokens,
 *      11 harbor markers." Special Build Phase: after each player's turn all
 *      other players may build in clockwise order; no trading, no dev cards.
 *      https://cdn.1j1ju.com/medias/79/f1/83-catan-5-6-player-extension-rulebook.pdf
 *  [3] Base harbors: 4 generic 3:1 and one 2:1 per resource (5), per the
 *      component list in [1] and BoardGameGeek's component breakdown
 *      https://boardgamegeek.com/thread/324667
 */

export type Resource = "lumber" | "wool" | "grain" | "brick" | "ore";
export type Terrain = "forest" | "pasture" | "fields" | "hills" | "mountains" | "desert";

export const RESOURCES: readonly Resource[] = ["lumber", "wool", "grain", "brick", "ore"];
export const TERRAINS: readonly Terrain[] = ["forest", "pasture", "fields", "hills", "mountains", "desert"];

/** Which resource a terrain produces. The desert produces nothing. */
export const TERRAIN_RESOURCE: Record<Terrain, Resource | null> = {
  forest: "lumber",
  pasture: "wool",
  fields: "grain",
  hills: "brick",
  mountains: "ore",
  desert: null,
};

export const RESOURCE_TERRAIN: Record<Resource, Terrain> = {
  lumber: "forest",
  wool: "pasture",
  grain: "fields",
  brick: "hills",
  ore: "mountains",
};

export const RESOURCE_LABEL: Record<Resource, string> = {
  lumber: "Lumber",
  wool: "Wool",
  grain: "Grain",
  brick: "Brick",
  ore: "Ore",
};

export const TERRAIN_LABEL: Record<Terrain, string> = {
  forest: "Forest",
  pasture: "Pasture",
  fields: "Fields",
  hills: "Hills",
  mountains: "Mountains",
  desert: "Desert",
};

/** Number of ways two six-sided dice make each total, out of 36. [1] Almanac, Number Tokens. */
export const DICE_WAYS: Readonly<Record<number, number>> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};
export const DICE_TOTAL_WAYS = 36;
export const DICE_TOTALS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Production numbers that can sit on a hex (no 7). */
export const TOKEN_NUMBERS: readonly number[] = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

/** Pips printed under a number token equal the ways to roll it. 7 has no token. */
export const pipsFor = (total: number): number => (total === 7 ? 0 : (DICE_WAYS[total] ?? 0));

/** The red numbers: most frequent producing totals. Setup rules keep them apart. */
export const RED_NUMBERS: readonly number[] = [6, 8];

/** "more than 7 resource cards must select half (rounded down)". [1] */
export const ROBBER_DISCARD_ABOVE = 7;
export const robberDiscardCount = (handSize: number): number =>
  handSize > ROBBER_DISCARD_ABOVE ? Math.floor(handSize / 2) : 0;

export const WINNING_VP = 10;
export const LONGEST_ROAD_VP = 2;
export const LARGEST_ARMY_VP = 2;

export type PlayerColor = "red" | "blue" | "orange" | "white" | "green" | "brown";
export const PLAYER_COLORS: readonly PlayerColor[] = ["red", "blue", "orange", "white", "green", "brown"];

export type Harbor = { kind: "generic" } | { kind: "resource"; resource: Resource };

export interface DevDeck {
  knight: number;
  victoryPoint: number;
  roadBuilding: number;
  yearOfPlenty: number;
  monopoly: number;
}

export type RuleSetId = "base" | "extension56";

export interface RuleSet {
  id: RuleSetId;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  /** Hexes per row, top to bottom. */
  hexRows: readonly number[];
  terrainCounts: Readonly<Record<Terrain, number>>;
  /** All number tokens, one per producing hex. */
  numberTokens: readonly number[];
  harbors: readonly Harbor[];
  devDeck: DevDeck;
  /** 5-6 players: everyone may build after each turn. [2] */
  specialBuildPhase: boolean;
}

const resourceHarbor = (resource: Resource): Harbor => ({ kind: "resource", resource });
const generic: Harbor = { kind: "generic" };

/** [1] and [3] */
export const BASE_RULES: RuleSet = {
  id: "base",
  name: "Base game (3-4 players)",
  minPlayers: 3,
  maxPlayers: 4,
  hexRows: [3, 4, 5, 4, 3],
  terrainCounts: { forest: 4, pasture: 4, fields: 4, hills: 3, mountains: 3, desert: 1 },
  numberTokens: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  harbors: [
    generic,
    generic,
    generic,
    generic,
    resourceHarbor("lumber"),
    resourceHarbor("wool"),
    resourceHarbor("grain"),
    resourceHarbor("brick"),
    resourceHarbor("ore"),
  ],
  devDeck: { knight: 14, victoryPoint: 5, roadBuilding: 2, yearOfPlenty: 2, monopoly: 2 },
  specialBuildPhase: false,
};

/** Base plus the 5-6 Player Extension. [2] */
export const EXTENSION_56_RULES: RuleSet = {
  id: "extension56",
  name: "5-6 player extension",
  minPlayers: 5,
  maxPlayers: 6,
  hexRows: [3, 4, 5, 6, 5, 4, 3],
  terrainCounts: { forest: 6, pasture: 6, fields: 6, hills: 5, mountains: 5, desert: 2 },
  numberTokens: [
    2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12,
  ],
  // Base set plus one more generic 3:1 and a second wool 2:1 (11 total).
  harbors: [...BASE_RULES.harbors, generic, resourceHarbor("wool")],
  devDeck: { knight: 20, victoryPoint: 5, roadBuilding: 3, yearOfPlenty: 3, monopoly: 3 },
  specialBuildPhase: true,
};

export const RULE_SETS: Readonly<Record<RuleSetId, RuleSet>> = {
  base: BASE_RULES,
  extension56: EXTENSION_56_RULES,
};

export const ruleSetForPlayers = (players: number): RuleSet =>
  players >= EXTENSION_56_RULES.minPlayers ? EXTENSION_56_RULES : BASE_RULES;

export const hexCount = (rules: RuleSet): number => rules.hexRows.reduce((a, b) => a + b, 0);
export const devDeckSize = (deck: DevDeck): number =>
  deck.knight + deck.victoryPoint + deck.roadBuilding + deck.yearOfPlenty + deck.monopoly;
