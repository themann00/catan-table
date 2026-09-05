import { drawCard, newDeck, rollDice, type DeckState, type DicePair } from "./dice";
import { isArrayOf, isNumber, isRecord } from "./storage";
import { cryptoRng, type Rng } from "./rng";

/**
 * Roll tab state as a pure reducer: which dice source is in use, the deck
 * (when in deck mode), and the roll log. Undo restores the deck exactly,
 * including a reshuffle that the undone draw triggered.
 */
export type DiceMode = "dice" | "deck";
export const isDiceMode = (v: unknown): v is DiceMode => v === "dice" || v === "deck";

export interface RollEntry extends DicePair {
  /** Monotonic id, also the roll number within this game. */
  id: number;
  total: number;
  /** Deck state before this draw, so undo can restore it. Absent in dice mode. */
  deckBefore?: DeckState;
  /** Index of the player who rolled, when players exist. */
  playerIndex?: number;
}

export interface RollState {
  mode: DiceMode;
  deck: DeckState;
  log: RollEntry[];
}

export type RollAction =
  | { type: "roll"; playerIndex?: number; rng?: Rng }
  | { type: "undo" }
  | { type: "setMode"; mode: DiceMode; rng?: Rng }
  | { type: "reshuffle"; rng?: Rng }
  | { type: "reset"; rng?: Rng };

/** Full history stays for the histogram; the UI shows the last 20. */
export const LOG_DISPLAY = 20;
/** Hard cap so localStorage cannot grow without bound over a long night. */
export const LOG_CAP = 500;

export function initialRollState(mode: DiceMode = "dice", rng: Rng = cryptoRng): RollState {
  return { mode, deck: newDeck(rng), log: [] };
}

export function rollReducer(state: RollState, action: RollAction): RollState {
  switch (action.type) {
    case "roll": {
      const rng = action.rng ?? cryptoRng;
      const id = (state.log[state.log.length - 1]?.id ?? 0) + 1;
      if (state.mode === "deck") {
        const { card, deck } = drawCard(state.deck, rng);
        const entry: RollEntry = { ...card, total: card.red + card.yellow, id, deckBefore: state.deck, playerIndex: action.playerIndex };
        return { ...state, deck, log: appendCapped(state.log, entry) };
      }
      const pair = rollDice(rng);
      const entry: RollEntry = { ...pair, total: pair.red + pair.yellow, id, playerIndex: action.playerIndex };
      return { ...state, log: appendCapped(state.log, entry) };
    }

    case "undo": {
      const last = state.log[state.log.length - 1];
      if (!last) return state;
      const log = state.log.slice(0, -1);
      const deck = state.mode === "deck" && last.deckBefore ? last.deckBefore : state.deck;
      return { ...state, deck, log };
    }

    case "setMode": {
      if (action.mode === state.mode) return state;
      // A fresh deck on every switch: the log keeps rolls from both sources.
      return { ...state, mode: action.mode, deck: newDeck(action.rng ?? cryptoRng) };
    }

    case "reshuffle":
      return { ...state, deck: newDeck(action.rng ?? cryptoRng) };

    case "reset":
      return initialRollState(state.mode, action.rng ?? cryptoRng);

    default:
      return state;
  }
}

function appendCapped(log: RollEntry[], entry: RollEntry): RollEntry[] {
  const next = [...log, entry];
  if (next.length <= LOG_CAP) return next;
  // Drop the oldest, and drop their deck snapshots' burden with them.
  return next.slice(next.length - LOG_CAP);
}

export const lastRoll = (state: RollState): RollEntry | null => state.log[state.log.length - 1] ?? null;
export const recentRolls = (state: RollState, n = LOG_DISPLAY): RollEntry[] => state.log.slice(-n).reverse();

/* Persistence validators. Deck snapshots inside the log are validated too. */
const isDicePair = (v: unknown): v is DicePair =>
  isRecord(v) && isNumber(v.red) && isNumber(v.yellow) && v.red >= 1 && v.red <= 6 && v.yellow >= 1 && v.yellow <= 6;

const isDeckState = (v: unknown): v is DeckState =>
  isRecord(v) &&
  isArrayOf(isDicePair)(v.cards) &&
  v.cards.length === 36 &&
  isNumber(v.drawn) &&
  v.drawn >= 0 &&
  v.drawn <= 36;

const isRollEntry = (v: unknown): v is RollEntry => {
  if (!isRecord(v) || !isDicePair(v)) return false;
  const o = v as Record<string, unknown> & DicePair;
  return (
    isNumber(o.id) &&
    isNumber(o.total) &&
    o.total === o.red + o.yellow &&
    (o.deckBefore === undefined || isDeckState(o.deckBefore)) &&
    (o.playerIndex === undefined || isNumber(o.playerIndex))
  );
};

export const isRollState = (v: unknown): v is RollState =>
  isRecord(v) && isDiceMode(v.mode) && isDeckState(v.deck) && isArrayOf(isRollEntry)(v.log);
