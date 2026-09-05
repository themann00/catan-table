import { describe, expect, it } from "vitest";
import { deckRemaining } from "./dice";
import { seededRng } from "./rng";
import { LOG_CAP, initialRollState, isRollState, lastRoll, recentRolls, rollReducer, type RollState } from "./roll-state";

const rng = () => seededRng(123);

describe("rollReducer", () => {
  it("appends a roll with a running id and matching total", () => {
    let s = initialRollState("dice", rng());
    s = rollReducer(s, { type: "roll", rng: rng() });
    s = rollReducer(s, { type: "roll", rng: rng(), playerIndex: 2 });
    expect(s.log).toHaveLength(2);
    expect(s.log[0].id).toBe(1);
    expect(s.log[1].id).toBe(2);
    expect(s.log[1].playerIndex).toBe(2);
    for (const e of s.log) expect(e.total).toBe(e.red + e.yellow);
    expect(lastRoll(s)?.id).toBe(2);
  });

  it("dice mode leaves the deck alone and stores no snapshot", () => {
    const s0 = initialRollState("dice", rng());
    const s1 = rollReducer(s0, { type: "roll", rng: rng() });
    expect(s1.deck).toBe(s0.deck);
    expect(s1.log[0].deckBefore).toBeUndefined();
  });

  it("deck mode draws and undo restores the deck", () => {
    const s0 = initialRollState("deck", rng());
    const s1 = rollReducer(s0, { type: "roll", rng: rng() });
    expect(deckRemaining(s1.deck)).toBe(35);
    expect(s1.log[0].deckBefore).toEqual(s0.deck);
    const s2 = rollReducer(s1, { type: "undo" });
    expect(s2.log).toHaveLength(0);
    expect(s2.deck).toEqual(s0.deck);
  });

  it("undo after a reshuffle brings back the pre-reshuffle deck", () => {
    let s: RollState = initialRollState("deck", rng());
    for (let i = 0; i < 31; i++) s = rollReducer(s, { type: "roll", rng: rng() });
    // The 31st draw left 5 cards, so the deck reshuffled to a fresh 36.
    expect(deckRemaining(s.deck)).toBe(36);
    const undone = rollReducer(s, { type: "undo" });
    expect(deckRemaining(undone.deck)).toBe(6);
    expect(undone.log).toHaveLength(30);
  });

  it("undo on an empty log is a no-op", () => {
    const s = initialRollState("dice", rng());
    expect(rollReducer(s, { type: "undo" })).toBe(s);
  });

  it("switching mode keeps the log and deals a fresh deck", () => {
    let s = initialRollState("deck", rng());
    s = rollReducer(s, { type: "roll", rng: rng() });
    s = rollReducer(s, { type: "roll", rng: rng() });
    const switched = rollReducer(s, { type: "setMode", mode: "dice", rng: rng() });
    expect(switched.mode).toBe("dice");
    expect(switched.log).toHaveLength(2);
    expect(deckRemaining(switched.deck)).toBe(36);
    expect(rollReducer(switched, { type: "setMode", mode: "dice" })).toBe(switched);
  });

  it("reset clears the log and keeps the mode", () => {
    let s = initialRollState("deck", rng());
    s = rollReducer(s, { type: "roll", rng: rng() });
    const r = rollReducer(s, { type: "reset", rng: rng() });
    expect(r.log).toHaveLength(0);
    expect(r.mode).toBe("deck");
    expect(deckRemaining(r.deck)).toBe(36);
  });

  it("caps the log and returns recent rolls newest first", () => {
    let s = initialRollState("dice", rng());
    const r = rng();
    for (let i = 0; i < LOG_CAP + 10; i++) s = rollReducer(s, { type: "roll", rng: r });
    expect(s.log).toHaveLength(LOG_CAP);
    expect(s.log[s.log.length - 1].id).toBe(LOG_CAP + 10);
    const recent = recentRolls(s, 3);
    expect(recent.map((e) => e.id)).toEqual([LOG_CAP + 10, LOG_CAP + 9, LOG_CAP + 8]);
  });
});

describe("isRollState", () => {
  it("accepts a real state round-tripped through JSON", () => {
    let s = initialRollState("deck", rng());
    s = rollReducer(s, { type: "roll", rng: rng() });
    expect(isRollState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });

  it("rejects malformed data", () => {
    expect(isRollState(null)).toBe(false);
    expect(isRollState({ mode: "deck", deck: { cards: [], drawn: 0 }, log: [] })).toBe(false);
    const s = initialRollState("dice", rng());
    expect(isRollState({ ...s, log: [{ red: 7, yellow: 1, total: 8, id: 1 }] })).toBe(false);
    expect(isRollState({ ...s, log: [{ red: 3, yellow: 1, total: 5, id: 1 }] })).toBe(false);
  });
});
