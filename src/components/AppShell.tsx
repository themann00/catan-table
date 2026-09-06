import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { TabBar } from "@/components/TabBar";
import { HexLogo } from "@/components/HexLogo";
import { LegendButton } from "@/components/Legend";
import type { Player } from "@/lib/game-state";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { Theme } from "@/hooks/use-theme";
import type { TabId, UiMode } from "@/lib/ui-state";

interface AppShellProps {
  /** Current game's players, for the color key. */
  players: Player[];
  mode: UiMode;
  onModeChange: (mode: UiMode) => void;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: Theme;
  onToggleTheme: () => void;
  children: ReactNode;
}

/**
 * Header with the mode toggle, tabs (top on desktop, bottom bar on phones),
 * and the active tab's content. Content gets bottom padding on phones so
 * the tab bar never covers the last control.
 */
export const AppShell = ({ players, mode, onModeChange, tab, onTabChange, theme, onToggleTheme, children }: AppShellProps) => {
  // One tab bar in the DOM at a time so tab ids stay unique for aria-labelledby.
  const isMobile = useIsMobile();
  return (
  <div className="flex min-h-dvh flex-col">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
    >
      Skip to content
    </a>
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[960px] items-center gap-3 px-3 py-2 sm:px-4">
        <a href="/" className="flex min-h-11 min-w-11 items-center gap-2 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Catan Table home">
          <HexLogo className="h-9 w-9" />
          <span className="hidden font-display text-xl font-bold tracking-tight sm:inline">Catan Table</span>
        </a>

        <div className="flex-1" />

        <ModeToggle mode={mode} onChange={onModeChange} />

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop tabs live under the header row */}
      {!isMobile && <TabBar mode={mode} tab={tab} onTabChange={onTabChange} placement="top" />}
    </header>

    <main className="mx-auto w-full max-w-[960px] flex-1 px-3 pb-[calc(5rem+var(--safe-bottom))] pt-4 sm:px-4 sm:pb-8" id="main" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {children}
    </main>

    <LegendButton players={players} tab={tab} isMobile={isMobile} />

    {/* Phone tabs: fixed bottom bar within thumb reach */}
    {isMobile && <TabBar mode={mode} tab={tab} onTabChange={onTabChange} placement="bottom" />}
  </div>
  );
};
