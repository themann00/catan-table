import { describe, expect, it } from "vitest";
import { isTabId, isUiMode, resolveTab, visibleTabs } from "./ui-state";

describe("ui-state", () => {
  it("hides the Odds tab in game mode", () => {
    expect(visibleTabs("game").map((t) => t.id)).toEqual(["roll", "board", "game"]);
    expect(visibleTabs("full").map((t) => t.id)).toEqual(["roll", "odds", "board", "game"]);
  });

  it("falls back to Roll when the active tab is hidden", () => {
    expect(resolveTab("odds", "game")).toBe("roll");
    expect(resolveTab("odds", "full")).toBe("odds");
    expect(resolveTab("board", "game")).toBe("board");
  });

  it("validates persisted values", () => {
    expect(isUiMode("full")).toBe(true);
    expect(isUiMode("predictions")).toBe(false);
    expect(isTabId("game")).toBe(true);
    expect(isTabId("settings")).toBe(false);
  });
});
