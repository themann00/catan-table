import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useTheme } from "@/hooks/use-theme";
import { isTabId, isUiMode, resolveTab, visibleTabs, type TabId, type UiMode } from "@/lib/ui-state";
import { BoardTab } from "@/pages/BoardTab";
import { GameTab } from "@/pages/GameTab";
import { OddsTab } from "@/pages/OddsTab";
import { RollTab } from "@/pages/RollTab";

const MODE_KEY = "mode:v1";
const TAB_KEY = "tab:v1";

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = usePersistedState<UiMode>(MODE_KEY, "game", isUiMode);
  const [tab, setTab] = usePersistedState<TabId>(TAB_KEY, "roll", isTabId);
  const activeTab = resolveTab(tab, mode);

  // Switching to Game mode while on Odds lands on Roll and stays there.
  useEffect(() => {
    if (activeTab !== tab) setTab(activeTab);
  }, [activeTab, tab, setTab]);

  // Desktop: 1-4 jump between tabs, M flips the mode.
  useKeyboardShortcuts(
    Object.fromEntries([
      ...visibleTabs(mode).map((t) => [t.shortcut, () => setTab(t.id)] as const),
      ["m", () => setMode((m) => (m === "game" ? "full" : "game"))],
    ]),
  );

  return (
    <AppShell mode={mode} onModeChange={setMode} tab={activeTab} onTabChange={setTab} theme={theme} onToggleTheme={toggleTheme}>
      {activeTab === "roll" && <RollTab mode={mode} />}
      {activeTab === "odds" && <OddsTab />}
      {activeTab === "board" && <BoardTab mode={mode} />}
      {activeTab === "game" && <GameTab mode={mode} />}
    </AppShell>
  );
};

export default App;
