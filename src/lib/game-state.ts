import { isDevCardType, type DevCardType } from "./dev-cards";
import {
  LARGEST_ARMY_VP,
  LONGEST_ROAD_VP,
  PLAYER_COLORS,
  WINNING_VP,
  ruleSetForPlayers,
  type PlayerColor,
  type RuleSet,
} from "./rules";
import { isArrayOf, isBoolean, isNumber, isOneOf, isRecord, isString } from "./storage";

/**
 * Game tab state as a pure reducer: players in turn order, whose turn it
 * is, victory points, the two 2-VP special cards, the development card
 * draws, and the optional turn timer. Winning is detected here so the UI
 * cannot show a 10-VP player without the game being over.
 *
 * Rules: 10 VP wins (base rules "The first player to reach 10 victory
 * points on their turn wins"); Longest Road and Largest Army are 2 VP each
 * and move between players.
 */
export type GameStatus = "setup" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  /** Visible points: settlements, cities, revealed VP cards. */
  vp: number;
  /** Hidden VP cards the player privately notes. Counted toward the win. */
  hiddenVp: number;
  hiddenNote: string;
}

export interface GameState {
  status: GameStatus;
  players: Player[];
  startingPlayerIndex: number;
  currentPlayerIndex: number;
  /** True once the current player has rolled; the next roll passes the turn. */
  rolledThisTurn: boolean;
  /** Completed turns (one per player roll). */
  turnCount: number;
  longestRoadId: string | null;
  largestArmyId: string | null;
  devCardsDrawn: DevCardType[];
  timerEnabled: boolean;
  /** Epoch ms when the current turn began; null while not playing. */
  turnStartedAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  winnerId: string | null;
}

export type GameAction =
  | { type: "addPlayer"; name?: string; now?: number }
  | { type: "removePlayer"; id: string }
  | { type: "renamePlayer"; id: string; name: string }
  | { type: "recolorPlayer"; id: string; color: PlayerColor }
  | { type: "movePlayer"; from: number; to: number }
  | { type: "setStartingPlayer"; index: number }
  | { type: "startGame"; now: number }
  | { type: "nextTurn"; now: number }
  | { type: "previousTurn"; now: number }
  | { type: "markRolled"; playerIndex?: number }
  | { type: "undoRoll"; playerIndex: number; now: number }
  | { type: "adjustVp"; id: string; delta: number; now: number }
  | { type: "setHiddenVp"; id: string; value: number; now: number }
  | { type: "setHiddenNote"; id: string; note: string }
  | { type: "toggleLongestRoad"; id: string; now: number }
  | { type: "toggleLargestArmy"; id: string; now: number }
  | { type: "drawDevCard"; card: DevCardType }
  | { type: "undoDevCard" }
  | { type: "setTimerEnabled"; enabled: boolean; now: number }
  | { type: "finishGame"; winnerId: string; now: number }
  | { type: "newGame"; keepPlayers: boolean }
  | { type: "replace"; state: GameState };

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const MAX_NAME_LENGTH = 16;

const DEFAULT_NAMES = ["Red", "Blue", "Orange", "White", "Green", "Brown"];

let idCounter = 0;
const newId = (): string => `p${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export function initialGameState(): GameState {
  return {
    status: "setup",
    players: [],
    startingPlayerIndex: 0,
    currentPlayerIndex: 0,
    rolledThisTurn: false,
    turnCount: 0,
    longestRoadId: null,
    largestArmyId: null,
    devCardsDrawn: [],
    timerEnabled: false,
    turnStartedAt: null,
    startedAt: null,
    finishedAt: null,
    winnerId: null,
  };
}

/** Three default players so the tab is usable on first open. */
export function defaultGameState(): GameState {
  let s = initialGameState();
  for (let i = 0; i < MIN_PLAYERS; i++) s = gameReducer(s, { type: "addPlayer" });
  return s;
}

export const rulesFor = (state: GameState): RuleSet => ruleSetForPlayers(Math.max(state.players.length, MIN_PLAYERS));

export const specialCardVp = (state: GameState, id: string): number =>
  (state.longestRoadId === id ? LONGEST_ROAD_VP : 0) + (state.largestArmyId === id ? LARGEST_ARMY_VP : 0);

export const totalVp = (state: GameState, player: Player): number => player.vp + player.hiddenVp + specialCardVp(state, player.id);

/** Points everyone can see: excludes hidden VP cards. */
export const publicVp = (state: GameState, player: Player): number => player.vp + specialCardVp(state, player.id);

export const currentPlayer = (state: GameState): Player | null => state.players[state.currentPlayerIndex] ?? null;

export const findPlayer = (state: GameState, id: string): Player | undefined => state.players.find((p) => p.id === id);

const unusedColor = (players: Player[]): PlayerColor =>
  PLAYER_COLORS.find((c) => !players.some((p) => p.color === c)) ?? PLAYER_COLORS[players.length % PLAYER_COLORS.length];

const clampVp = (n: number): number => Math.max(0, Math.min(99, Math.floor(n)));

const updatePlayer = (state: GameState, id: string, patch: (p: Player) => Player): GameState => ({
  ...state,
  players: state.players.map((p) => (p.id === id ? patch(p) : p)),
});

/** After any point change: end the game if someone is at or past 10 VP. */
function checkWin(state: GameState, now: number): GameState {
  if (state.status !== "playing") return state;
  const winner = state.players.find((p) => totalVp(state, p) >= WINNING_VP);
  if (!winner) return state;
  return { ...state, status: "finished", winnerId: winner.id, finishedAt: now, turnStartedAt: null };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "addPlayer": {
      if (state.players.length >= MAX_PLAYERS || state.status === "finished") return state;
      const color = unusedColor(state.players);
      const name = (action.name ?? DEFAULT_NAMES[PLAYER_COLORS.indexOf(color)] ?? `Player ${state.players.length + 1}`).slice(0, MAX_NAME_LENGTH);
      const player: Player = { id: newId(), name, color, vp: 0, hiddenVp: 0, hiddenNote: "" };
      return { ...state, players: [...state.players, player] };
    }

    case "removePlayer": {
      const index = state.players.findIndex((p) => p.id === action.id);
      if (index < 0 || state.status === "finished") return state;
      const players = state.players.filter((p) => p.id !== action.id);
      const fix = (i: number) => (players.length === 0 ? 0 : i > index ? i - 1 : i === index ? i % players.length : i);
      return {
        ...state,
        players,
        startingPlayerIndex: fix(state.startingPlayerIndex),
        currentPlayerIndex: fix(state.currentPlayerIndex),
        longestRoadId: state.longestRoadId === action.id ? null : state.longestRoadId,
        largestArmyId: state.largestArmyId === action.id ? null : state.largestArmyId,
      };
    }

    case "renamePlayer":
      return updatePlayer(state, action.id, (p) => ({ ...p, name: action.name.slice(0, MAX_NAME_LENGTH) }));

    case "recolorPlayer":
      return updatePlayer(state, action.id, (p) => ({ ...p, color: action.color }));

    case "movePlayer": {
      const { from, to } = action;
      const n = state.players.length;
      if (from === to || from < 0 || to < 0 || from >= n || to >= n) return state;
      const players = state.players.slice();
      const [moved] = players.splice(from, 1);
      players.splice(to, 0, moved);
      const remap = (i: number) => players.findIndex((p) => p.id === state.players[i].id);
      return {
        ...state,
        players,
        startingPlayerIndex: remap(state.startingPlayerIndex),
        currentPlayerIndex: remap(state.currentPlayerIndex),
      };
    }

    case "setStartingPlayer": {
      if (action.index < 0 || action.index >= state.players.length) return state;
      const next = { ...state, startingPlayerIndex: action.index };
      // Before the first roll the starting player is also the current one.
      return state.status === "setup" || (state.turnCount === 0 && !state.rolledThisTurn)
        ? { ...next, currentPlayerIndex: action.index }
        : next;
    }

    case "startGame": {
      if (state.status !== "setup" || state.players.length < MIN_PLAYERS) return state;
      return {
        ...state,
        status: "playing",
        currentPlayerIndex: state.startingPlayerIndex,
        rolledThisTurn: false,
        turnCount: 0,
        startedAt: action.now,
        turnStartedAt: action.now,
        finishedAt: null,
        winnerId: null,
      };
    }

    case "nextTurn": {
      if (state.status !== "playing" || state.players.length === 0) return state;
      return {
        ...state,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        rolledThisTurn: false,
        turnCount: state.turnCount + 1,
        turnStartedAt: action.now,
      };
    }

    case "previousTurn": {
      if (state.status !== "playing" || state.players.length === 0 || state.turnCount === 0) return state;
      const n = state.players.length;
      return {
        ...state,
        currentPlayerIndex: (state.currentPlayerIndex - 1 + n) % n,
        rolledThisTurn: false,
        turnCount: state.turnCount - 1,
        turnStartedAt: action.now,
      };
    }

    case "markRolled": {
      if (state.status !== "playing") return state;
      const index = action.playerIndex ?? state.currentPlayerIndex;
      if (index < 0 || index >= state.players.length) return state;
      return { ...state, currentPlayerIndex: index, rolledThisTurn: true };
    }

    case "undoRoll": {
      // The undone roll belonged to `playerIndex`. If the turn had already
      // passed to them from someone else, step the turn counter back too.
      if (state.status !== "playing") return state;
      if (action.playerIndex < 0 || action.playerIndex >= state.players.length) return state;
      const moved = state.currentPlayerIndex !== action.playerIndex;
      return {
        ...state,
        currentPlayerIndex: action.playerIndex,
        rolledThisTurn: false,
        turnCount: moved ? Math.max(0, state.turnCount - 1) : state.turnCount,
        turnStartedAt: action.now,
      };
    }

    case "adjustVp": {
      if (state.status === "finished") return state;
      const next = updatePlayer(state, action.id, (p) => ({ ...p, vp: clampVp(p.vp + action.delta) }));
      return checkWin(next, action.now);
    }

    case "setHiddenVp": {
      if (state.status === "finished") return state;
      const next = updatePlayer(state, action.id, (p) => ({ ...p, hiddenVp: clampVp(action.value) }));
      return checkWin(next, action.now);
    }

    case "setHiddenNote":
      return updatePlayer(state, action.id, (p) => ({ ...p, hiddenNote: action.note.slice(0, 120) }));

    case "toggleLongestRoad": {
      if (state.status === "finished" || !findPlayer(state, action.id)) return state;
      const next = { ...state, longestRoadId: state.longestRoadId === action.id ? null : action.id };
      return checkWin(next, action.now);
    }

    case "toggleLargestArmy": {
      if (state.status === "finished" || !findPlayer(state, action.id)) return state;
      const next = { ...state, largestArmyId: state.largestArmyId === action.id ? null : action.id };
      return checkWin(next, action.now);
    }

    case "drawDevCard": {
      if (state.status === "finished") return state;
      const full = rulesFor(state).devDeck;
      const drawnOfType = state.devCardsDrawn.filter((c) => c === action.card).length;
      if (drawnOfType >= full[action.card]) return state;
      return { ...state, devCardsDrawn: [...state.devCardsDrawn, action.card] };
    }

    case "undoDevCard":
      if (state.devCardsDrawn.length === 0) return state;
      return { ...state, devCardsDrawn: state.devCardsDrawn.slice(0, -1) };

    case "setTimerEnabled":
      return {
        ...state,
        timerEnabled: action.enabled,
        turnStartedAt: state.status === "playing" ? (state.turnStartedAt ?? action.now) : state.turnStartedAt,
      };

    case "finishGame": {
      if (state.status !== "playing" || !findPlayer(state, action.winnerId)) return state;
      return { ...state, status: "finished", winnerId: action.winnerId, finishedAt: action.now, turnStartedAt: null };
    }

    case "newGame": {
      const base = initialGameState();
      if (!action.keepPlayers) return base;
      return {
        ...base,
        players: state.players.map((p) => ({ ...p, vp: 0, hiddenVp: 0, hiddenNote: "" })),
        startingPlayerIndex: state.startingPlayerIndex < state.players.length ? state.startingPlayerIndex : 0,
        currentPlayerIndex: state.startingPlayerIndex < state.players.length ? state.startingPlayerIndex : 0,
        timerEnabled: state.timerEnabled,
      };
    }

    case "replace":
      return action.state;

    default:
      return state;
  }
}

/* Game summaries kept after a win. */
export interface GameSummary {
  id: string;
  finishedAt: number;
  durationMs: number;
  turns: number;
  winnerName: string;
  players: Array<{ name: string; color: PlayerColor; vp: number }>;
}

export const MAX_HISTORY = 10;

export function summarize(state: GameState): GameSummary | null {
  if (state.status !== "finished" || !state.winnerId || !state.finishedAt) return null;
  const winner = findPlayer(state, state.winnerId);
  if (!winner) return null;
  return {
    id: `g${state.finishedAt.toString(36)}`,
    finishedAt: state.finishedAt,
    durationMs: state.startedAt ? state.finishedAt - state.startedAt : 0,
    turns: state.turnCount,
    winnerName: winner.name,
    players: state.players.map((p) => ({ name: p.name, color: p.color, vp: totalVp(state, p) })),
  };
}

export const pushHistory = (history: GameSummary[], summary: GameSummary): GameSummary[] =>
  history.some((h) => h.id === summary.id) ? history : [summary, ...history].slice(0, MAX_HISTORY);

/* Validators for persisted state. */
const isPlayerColor = isOneOf(PLAYER_COLORS);

const isPlayer = (v: unknown): v is Player =>
  isRecord(v) &&
  isString(v.id) &&
  isString(v.name) &&
  isPlayerColor(v.color) &&
  isNumber(v.vp) &&
  isNumber(v.hiddenVp) &&
  isString(v.hiddenNote);

const isNullableNumber = (v: unknown): v is number | null => v === null || isNumber(v);
const isNullableString = (v: unknown): v is string | null => v === null || isString(v);

export const isGameState = (v: unknown): v is GameState =>
  isRecord(v) &&
  isOneOf(["setup", "playing", "finished"] as const)(v.status) &&
  isArrayOf(isPlayer)(v.players) &&
  v.players.length <= MAX_PLAYERS &&
  isNumber(v.startingPlayerIndex) &&
  isNumber(v.currentPlayerIndex) &&
  isBoolean(v.rolledThisTurn) &&
  isNumber(v.turnCount) &&
  isNullableString(v.longestRoadId) &&
  isNullableString(v.largestArmyId) &&
  isArrayOf(isDevCardType)(v.devCardsDrawn) &&
  isBoolean(v.timerEnabled) &&
  isNullableNumber(v.turnStartedAt) &&
  isNullableNumber(v.startedAt) &&
  isNullableNumber(v.finishedAt) &&
  isNullableString(v.winnerId);

export const isGameSummary = (v: unknown): v is GameSummary =>
  isRecord(v) &&
  isString(v.id) &&
  isNumber(v.finishedAt) &&
  isNumber(v.durationMs) &&
  isNumber(v.turns) &&
  isString(v.winnerName) &&
  isArrayOf((p: unknown): p is GameSummary["players"][number] => isRecord(p) && isString(p.name) && isPlayerColor(p.color) && isNumber(p.vp))(v.players);

export const isGameHistory = isArrayOf(isGameSummary);
