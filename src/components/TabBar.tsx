import { Dices, Hexagon, Percent, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleTabs, type TabId, type UiMode } from "@/lib/ui-state";

interface TabBarProps {
  mode: UiMode;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  placement: "top" | "bottom";
}

const ICONS: Record<TabId, LucideIcon> = {
  roll: Dices,
  odds: Percent,
  board: Hexagon,
  game: Users,
};

/**
 * Tab list. "bottom" renders a fixed bar with 56px targets for phones,
 * "top" renders an inline strip under the desktop header.
 */
export const TabBar = ({ mode, tab, onTabChange, placement }: TabBarProps) => {
  const tabs = visibleTabs(mode);
  const bottom = placement === "bottom";

  return (
    <nav
      aria-label="Sections"
      className={cn(
        bottom
          ? "fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[var(--safe-bottom)] backdrop-blur-md"
          : "mx-auto max-w-[960px] px-4",
      )}
    >
      <div role="tablist" aria-orientation="horizontal" className={cn("flex", bottom ? "" : "gap-1")}>
        {tabs.map((t) => {
          const Icon = ICONS[t.id];
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls="main"
              onClick={() => onTabChange(t.id)}
              className={cn(
                "touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                bottom
                  ? "flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
                  : "flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold",
                selected
                  ? bottom
                    ? "text-primary"
                    : "border-primary text-primary"
                  : bottom
                    ? "text-muted-foreground hover:text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn(bottom ? "h-6 w-6" : "h-4 w-4")} aria-hidden="true" />
              <span>{t.label}</span>
              {!bottom && (
                <kbd aria-hidden="true" className="ml-1 hidden rounded border border-border/70 px-1 text-[10px] font-normal text-muted-foreground lg:inline">
                  {t.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
