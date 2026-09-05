import { describe, expect, it } from "vitest";
import {
  MAX_PLAYERS,
  currentPlayer,
  defaultGameState,
  gameReducer,
  initialGameState,
  isGameState,
  pushHistory,
  rulesFor,
  summarize,
  totalVp,
  type GameState,
} from "./game-state";

const NOW = 1_700_000_000_000;

const playing = (players = 4): GameState => {
  let s = initialGameState();
  for (let i = 0; i < players; i++) s = gameReducer(s, { type: "addPlayer" });
  return gameReducer(s, { type: "startGame", now: NOW });
};

describe("players", () => {
  it("adds up to six players with distinct colors and default names", () => {
    let s = initialGameState();
    for (let i = 0; i < 8; i++) s = gameReducer(s, { type: "addPlayer" });
    expect(s.players).toHaveLength(MAX_PLAYERS);
    expect(new Set(s.players.map((p) => p.color)).size).toBe(MAX_PLAYERS);
    expect(s.players[0].name).toBe("Red");
    expect(s.players[5].name).toBe("Brown");
  });

  it("defaults to three players", () => {
    expect(defaultGameState().players).toHaveLength(3);
    expect(rulesFor(defaultGameState()).id).toBe("base");
  });

  it("picks the extension rules at five players", () => {
    expect(rulesFor(playing(4)).id).toBe("base");
    expect(rulesFor(playing(5)).id).toBe("extension56");
  });

  it("removes a player and repairs indexes and special cards", () => {
    let s = playing(4);
    const [a, b, c] = s.players;
    s = gameReducer(s, { type: "toggleLongestRoad", id: b.id, now: NOW });
    s = gameReducer(s, { type: "setStartingPlayer", index: 2 });
    s = gameReducer(s, { type: "removePlayer", id: b.id });
    expect(s.players.map((p) => p.id)).not.toContain(b.id);
    expect(s.longestRoadId).toBeNull();
    expect(s.players[s.startingPlayerIndex].id).toBe(c.id);
    expect(s.players[0].id).toBe(a.id);
  });

  it("reorders players and keeps the current player pointer on the same person", () => {
    let s = playing(4);
    const cur = currentPlayer(s)!;
    s = gameReducer(s, { type: "movePlayer", from: 0, to: 3 });
    expect(currentPlayer(s)!.id).toBe(cur.id);
    expect(s.players[3].id).toBe(cur.id);
    expect(gameReducer(s, { type: "movePlayer", from: 0, to: 9 })).toBe(s);
  });

  it("truncates long names", () => {
    let s = defaultGameState();
    s = gameReducer(s, { type: "renamePlayer", id: s.players[0].id, name: "A very long player name indeed" });
    expect(s.players[0].name.length).toBeLessThanOrEqual(16);
  });
});

describe("turns", () => {
  it("requires three players to start", () => {
    let s = initialGameState();
    s = gameReducer(s, { type: "addPlayer" });
    s = gameReducer(s, { type: "addPlayer" });
    expect(gameReducer(s, { type: "startGame", now: NOW }).status).toBe("setup");
    s = gameReducer(s, { type: "addPlayer" });
    expect(gameReducer(s, { type: "startGame", now: NOW }).status).toBe("playing");
  });

  it("starts with the chosen starting player and cycles", () => {
    let s = initialGameState();
    for (let i = 0; i < 3; i++) s = gameReducer(s, { type: "addPlayer" });
    s = gameReducer(s, { type: "setStartingPlayer", index: 2 });
    s = gameReducer(s, { type: "startGame", now: NOW });
    expect(s.currentPlayerIndex).toBe(2);
    s = gameReducer(s, { type: "nextTurn", now: NOW + 1 });
    expect(s.currentPlayerIndex).toBe(0);
    expect(s.turnCount).toBe(1);
    expect(s.turnStartedAt).toBe(NOW + 1);
    s = gameReducer(s, { type: "previousTurn", now: NOW + 2 });
    expect(s.currentPlayerIndex).toBe(2);
    expect(s.turnCount).toBe(0);
    expect(gameReducer(s, { type: "previousTurn", now: NOW + 3 })).toBe(s);
  });

  it("undoing a roll returns the turn to the roller", () => {
    let s = playing(3);
    s = gameReducer(s, { type: "markRolled" });
    // Same player undoes: turn count unchanged, roll flag cleared.
    let u = gameReducer(s, { type: "undoRoll", playerIndex: 0, now: NOW });
    expect(u.currentPlayerIndex).toBe(0);
    expect(u.rolledThisTurn).toBe(false);
    expect(u.turnCount).toBe(0);
    // Turn passed to player 1 who rolled; undo brings player 1 back to pre-roll,
    // and undoing player 0's roll from there steps the counter back.
    s = gameReducer(s, { type: "nextTurn", now: NOW });
    s = gameReducer(s, { type: "markRolled" });
    expect(s.turnCount).toBe(1);
    u = gameReducer(s, { type: "undoRoll", playerIndex: 0, now: NOW });
    expect(u.currentPlayerIndex).toBe(0);
    expect(u.turnCount).toBe(0);
  });

  it("marks the roll and lets the next roll pass the turn", () => {
    let s = playing(3);
    expect(s.rolledThisTurn).toBe(false);
    s = gameReducer(s, { type: "markRolled" });
    expect(s.rolledThisTurn).toBe(true);
    s = gameReducer(s, { type: "nextTurn", now: NOW });
    expect(s.rolledThisTurn).toBe(false);
    expect(s.currentPlayerIndex).toBe(1);
  });
});

describe("points and winning", () => {
  it("counts hidden VP and special cards toward the total", () => {
    let s = playing(3);
    const p = s.players[0];
    s = gameReducer(s, { type: "adjustVp", id: p.id, delta: 3, now: NOW });
    s = gameReducer(s, { type: "setHiddenVp", id: p.id, value: 1, now: NOW });
    s = gameReducer(s, { type: "toggleLongestRoad", id: p.id, now: NOW });
    s = gameReducer(s, { type: "toggleLargestArmy", id: p.id, now: NOW });
    expect(totalVp(s, s.players[0])).toBe(3 + 1 + 2 + 2);
    expect(s.status).toBe("playing");
  });

  it("moves Longest Road between players", () => {
    let s = playing(3);
    const [a, b] = s.players;
    s = gameReducer(s, { type: "toggleLongestRoad", id: a.id, now: NOW });
    expect(s.longestRoadId).toBe(a.id);
    s = gameReducer(s, { type: "toggleLongestRoad", id: b.id, now: NOW });
    expect(s.longestRoadId).toBe(b.id);
    s = gameReducer(s, { type: "toggleLongestRoad", id: b.id, now: NOW });
    expect(s.longestRoadId).toBeNull();
  });

  it("never lets VP go below zero", () => {
    let s = playing(3);
    s = gameReducer(s, { type: "adjustVp", id: s.players[0].id, delta: -5, now: NOW });
    expect(s.players[0].vp).toBe(0);
  });

  it("finishes the game at 10 VP and freezes changes", () => {
    let s = playing(3);
    const p = s.players[1];
    s = gameReducer(s, { type: "adjustVp", id: p.id, delta: 8, now: NOW });
    expect(s.status).toBe("playing");
    s = gameReducer(s, { type: "toggleLargestArmy", id: p.id, now: NOW + 5 });
    expect(s.status).toBe("finished");
    expect(s.winnerId).toBe(p.id);
    expect(s.finishedAt).toBe(NOW + 5);
    const frozen = gameReducer(s, { type: "adjustVp", id: p.id, delta: 1, now: NOW + 6 });
    expect(frozen).toBe(s);
  });

  it("does not finish during setup", () => {
    let s = defaultGameState();
    s = gameReducer(s, { type: "adjustVp", id: s.players[0].id, delta: 10, now: NOW });
    expect(s.status).toBe("setup");
  });

  it("summarizes a finished game and caps history at ten", () => {
    let s = playing(3);
    s = gameReducer(s, { type: "nextTurn", now: NOW + 1000 });
    s = gameReducer(s, { type: "adjustVp", id: s.players[2].id, delta: 10, now: NOW + 60_000 });
    const summary = summarize(s)!;
    expect(summary.winnerName).toBe(s.players[2].name);
    expect(summary.turns).toBe(1);
    expect(summary.durationMs).toBe(60_000);
    expect(summary.players[2].vp).toBe(10);

    let history = pushHistory([], summary);
    expect(pushHistory(history, summary)).toHaveLength(1);
    for (let i = 0; i < 12; i++) history = pushHistory(history, { ...summary, id: `x${i}` });
    expect(history).toHaveLength(10);
    expect(history[0].id).toBe("x11");
  });

  it("starts a new game with the same players and zeroed points", () => {
    let s = playing(3);
    s = gameReducer(s, { type: "adjustVp", id: s.players[0].id, delta: 10, now: NOW });
    const fresh = gameReducer(s, { type: "newGame", keepPlayers: true });
    expect(fresh.status).toBe("setup");
    expect(fresh.players).toHaveLength(3);
    expect(fresh.players.every((p) => p.vp === 0 && p.hiddenVp === 0)).toBe(true);
    expect(fresh.winnerId).toBeNull();
    expect(gameReducer(s, { type: "newGame", keepPlayers: false }).players).toHaveLength(0);
  });
});

describe("dev cards", () => {
  it("draws up to the deck size per type and undoes", () => {
    let s = playing(3);
    for (let i = 0; i < 3; i++) s = gameReducer(s, { type: "drawDevCard", card: "monopoly" });
    expect(s.devCardsDrawn.filter((c) => c === "monopoly")).toHaveLength(2);
    s = gameReducer(s, { type: "undoDevCard" });
    expect(s.devCardsDrawn).toHaveLength(1);
    s = gameReducer(s, { type: "undoDevCard" });
    expect(gameReducer(s, { type: "undoDevCard" })).toBe(s);
  });

  it("allows 3 monopolies with the extension deck", () => {
    let s = playing(5);
    for (let i = 0; i < 4; i++) s = gameReducer(s, { type: "drawDevCard", card: "monopoly" });
    expect(s.devCardsDrawn).toHaveLength(3);
  });
});

describe("timer", () => {
  it("stamps the turn start when enabled mid-game", () => {
    let s = playing(3);
    s = { ...s, turnStartedAt: null };
    s = gameReducer(s, { type: "setTimerEnabled", enabled: true, now: NOW + 9 });
    expect(s.timerEnabled).toBe(true);
    expect(s.turnStartedAt).toBe(NOW + 9);
  });
});

describe("isGameState", () => {
  it("round-trips through JSON", () => {
    const s = playing(4);
    expect(isGameState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });

  it("rejects bad shapes", () => {
    expect(isGameState({})).toBe(false);
    const s = playing(3);
    expect(isGameState({ ...s, players: [{ id: "x" }] })).toBe(false);
    expect(isGameState({ ...s, devCardsDrawn: ["wizard"] })).toBe(false);
  });
});
