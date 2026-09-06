import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useBoard } from "@/hooks/use-board";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useTheme } from "@/hooks/use-theme";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  MIN_PLAYERS,
  defaultGameState,
  gameReducer,
  isGameHistory,
  isGameState,
  pushHistory,
  rulesFor,
  summarize,
  type GameAction,
  type GameState,
  type GameSummary,
} from "@/lib/game-state";
import { buzzWin } from "@/lib/haptics";
import { initialRollState, isRollState, rollReducer, type RollEntry, type RollState } from "@/lib/roll-state";
import { isTabId, isUiMode, resolveTab, visibleTabs, type TabId, type UiMode } from "@/lib/ui-state";
import { RollTab } from "@/pages/RollTab";

// The Roll tab is what the table opens to; the others load on first visit
// (and are precached by the service worker for offline use).
const OddsTab = lazy(() => import("@/pages/OddsTab").then((m) => ({ default: m.OddsTab })));
const BoardTab = lazy(() => import("@/pages/BoardTab").then((m) => ({ default: m.BoardTab })));
const GameTab = lazy(() => import("@/pages/GameTab").then((m) => ({ default: m.GameTab })));

const TabFallback = () => (
  <Card aria-busy="true">
    <CardContent className="p-6 text-center text-sm text-muted-foreground">Loading…</CardContent>
  </Card>
);

const MODE_KEY = "mode:v1";
const TAB_KEY = "tab:v1";
const GAME_KEY = "game:v1";
const HISTORY_KEY = "history:v1";
const ROLL_KEY = "roll:v1";

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = usePersistedState<UiMode>(MODE_KEY, "game", isUiMode);
  const [tab, setTab] = usePersistedState<TabId>(TAB_KEY, "roll", isTabId);
  const activeTab = resolveTab(tab, mode);

  // Switching to Game mode while on Odds lands on Roll and stays there.
  useEffect(() => {
    if (activeTab !== tab) setTab(activeTab);
  }, [activeTab, tab, setTab]);

  // Live game, roll log, and finished-game history all survive a refresh.
  const [game, setGame] = usePersistedState<GameState>(GAME_KEY, defaultGameState, isGameState);
  const [history, setHistory] = usePersistedState<GameSummary[]>(HISTORY_KEY, [], isGameHistory);
  const [roll, setRoll] = usePersistedState<RollState>(ROLL_KEY, initialRollState, isRollState);
  const dispatchGame = useCallback((action: GameAction) => setGame((g) => gameReducer(g, action)), [setGame]);
  const [board, setBoard] = useBoard();

  // Record a win once, buzz, and open the summary.
  const [winOpen, setWinOpen] = useState(false);
  const lastRecorded = useRef<string | null>(null);
  useEffect(() => {
    if (game.status !== "finished") return;
    const summary = summarize(game);
    if (!summary || lastRecorded.current === summary.id) return;
    lastRecorded.current = summary.id;
    // Already in history means this is a reload of a finished game: stay quiet.
    if (history.some((h) => h.id === summary.id)) return;
    setHistory((h) => pushHistory(h, summary));
    buzzWin();
    setWinOpen(true);
  }, [game, history, setHistory]);

  useWakeLock(game.status === "playing");

  const playing = game.status === "playing";
  const enoughPlayers = game.players.length >= MIN_PLAYERS;
  const playerNames = enoughPlayers ? game.players.map((p) => p.name) : undefined;
  // The next roll belongs to the current player, or to the next one if they
  // already rolled. In setup the first roll starts the game for the starter.
  const rollerIndex = playing
    ? game.rolledThisTurn
      ? (game.currentPlayerIndex + 1) % game.players.length
      : game.currentPlayerIndex
    : game.status === "setup" && enoughPlayers
      ? game.startingPlayerIndex
      : undefined;

  const onRolled = useCallback(
    (playerIndex: number | undefined) => {
      const now = Date.now();
      setGame((g) => {
        let next = g;
        if (next.status === "setup" && next.players.length >= MIN_PLAYERS) next = gameReducer(next, { type: "startGame", now });
        if (next.status !== "playing") return next;
        if (next.rolledThisTurn) next = gameReducer(next, { type: "nextTurn", now });
        return gameReducer(next, { type: "markRolled", playerIndex });
      });
    },
    [setGame],
  );

  const onUndoRoll = useCallback(
    (entry: RollEntry) => {
      if (entry.playerIndex === undefined) return;
      dispatchGame({ type: "undoRoll", playerIndex: entry.playerIndex, now: Date.now() });
    },
    [dispatchGame],
  );

  const newGame = useCallback(
    (keepPlayers: boolean) => {
      setWinOpen(false);
      dispatchGame({ type: "newGame", keepPlayers });
      setRoll((r) => rollReducer(r, { type: "reset" }));
    },
    [dispatchGame, setRoll],
  );

  // Desktop: 1-4 jump between tabs, M flips the mode.
  useKeyboardShortcuts(
    Object.fromEntries([
      ...visibleTabs(mode).map((t) => [t.shortcut, () => setTab(t.id)] as const),
      ["m", () => setMode((m) => (m === "game" ? "full" : "game"))],
    ]),
  );

  return (
    <AppShell players={game.players} mode={mode} onModeChange={setMode} tab={activeTab} onTabChange={setTab} theme={theme} onToggleTheme={toggleTheme}>
      {activeTab === "roll" && (
        <RollTab
          mode={mode}
          state={roll}
          onChange={setRoll}
          playerNames={playerNames}
          rollerIndex={rollerIndex}
          onRolled={onRolled}
          onUndoRoll={onUndoRoll}
          specialBuildPhase={playing && rulesFor(game).specialBuildPhase}
        />
      )}
      <Suspense fallback={<TabFallback />}>
        {activeTab === "odds" && <OddsTab board={board} />}
        {activeTab === "board" && <BoardTab mode={mode} board={board} onBoardChange={setBoard} />}
        {activeTab === "game" && (
          <GameTab mode={mode} game={game} dispatch={dispatchGame} history={history} onNewGame={newGame} winOpen={winOpen} onWinClose={() => setWinOpen(false)} />
        )}
      </Suspense>
    </AppShell>
  );
};

export default App;
