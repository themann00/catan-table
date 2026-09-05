/**
 * App-level UI state shared by the shell: which tab is open and whether
 * the table sees the lean "Game mode" or the stats-heavy "Full mode".
 */

/** "game" shows only what the table needs; "full" adds stats and odds. */
export type UiMode = "game" | "full";
export const isUiMode = (v: unknown): v is UiMode => v === "game" || v === "full";

export type TabId = "roll" | "odds" | "board" | "game";
export const TAB_IDS: readonly TabId[] = ["roll", "odds", "board", "game"];
export const isTabId = (v: unknown): v is TabId => TAB_IDS.includes(v as TabId);

export interface TabDef {
  id: TabId;
  label: string;
  /** Tabs only shown in Full mode. */
  fullOnly: boolean;
  /** Single-key desktop shortcut. */
  shortcut: string;
}

export const TABS: readonly TabDef[] = [
  { id: "roll", label: "Roll", fullOnly: false, shortcut: "1" },
  { id: "odds", label: "Odds", fullOnly: true, shortcut: "2" },
  { id: "board", label: "Board", fullOnly: false, shortcut: "3" },
  { id: "game", label: "Game", fullOnly: false, shortcut: "4" },
];

export const visibleTabs = (mode: UiMode): TabDef[] => TABS.filter((t) => mode === "full" || !t.fullOnly);

/** A tab hidden by the current mode falls back to Roll. */
export const resolveTab = (tab: TabId, mode: UiMode): TabId =>
  visibleTabs(mode).some((t) => t.id === tab) ? tab : "roll";
