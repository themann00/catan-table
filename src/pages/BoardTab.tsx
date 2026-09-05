import { useEffect, useState } from "react";
import { Expand, Link2, LockOpen, Printer, RotateCw, Shuffle, X } from "lucide-react";
import { HexBoard } from "@/components/HexBoard";
import { Segmented } from "@/components/Segmented";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { balanceReport, clearLocks, encodeBoard, generateBoard, toggleLock, type Board, type SetupMode } from "@/lib/board";
import { RESOURCE_BAR } from "@/lib/resource-colors";
import { RESOURCES, RESOURCE_LABEL, RULE_SETS, type RuleSetId } from "@/lib/rules";
import { seedToString } from "@/lib/rng";
import type { UiMode } from "@/lib/ui-state";
import { cn } from "@/lib/utils";

export interface BoardTabProps {
  mode: UiMode;
  board: Board;
  onBoardChange: (board: Board) => void;
}

const LAYOUTS = [
  { value: "base", label: "19 hexes", hint: "Base game, 3-4 players" },
  { value: "extension56", label: "30 hexes", hint: "5-6 player extension" },
] as const;

const MODES = [
  { value: "random", label: "Random", hint: "Official variable set-up" },
  { value: "balanced", label: "Balanced", hint: "Spread pips, no resource clusters" },
] as const;

const shareUrl = (board: Board): string => {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("b", encodeBoard(board));
  return url.toString();
};

export const BoardTab = ({ mode, board, onBoardChange }: BoardTabProps) => {
  const full = mode === "full";
  const rules = RULE_SETS[board.layout];
  const lockedCount = board.hexes.filter((h) => h.locked).length;
  const report = full ? balanceReport(board) : null;
  const [tableView, setTableView] = useState(false);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");

  const regenerate = (layout: RuleSetId = board.layout, setup: SetupMode = board.mode, keep = true) =>
    onBoardChange(generateBoard({ layout, mode: setup, keep: keep ? board : undefined }));

  const copyLink = async () => {
    const url = shareUrl(board);
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  };

  useEffect(() => {
    if (copied === "idle") return;
    const t = window.setTimeout(() => setCopied("idle"), 2500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented value={board.layout} options={LAYOUTS} onChange={(l) => regenerate(l, board.mode, false)} label="Board size" size="compact" />
            <Segmented value={board.mode} options={MODES} onChange={(m) => regenerate(board.layout, m)} label="Set-up method" size="compact" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => regenerate()} size="lg" className="flex-1 sm:flex-none">
              <Shuffle /> {lockedCount > 0 ? `Reroll ${board.hexes.length - lockedCount} unlocked` : "New board"}
            </Button>
            {lockedCount > 0 && (
              <Button variant="outline" onClick={() => onBoardChange(clearLocks(board))} aria-label="Unlock all hexes">
                <LockOpen /> Unlock all
              </Button>
            )}
            <Button variant="outline" onClick={copyLink} aria-live="polite">
              <Link2 /> {copied === "copied" ? "Link copied" : copied === "failed" ? "Copy failed" : "Share"}
            </Button>
            <Button variant="outline" onClick={() => setTableView(true)}>
              <Expand /> Table view
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="hidden sm:inline-flex">
              <Printer /> Print
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a hex to lock it, then reroll the rest. Seed <span className="font-mono">{seedToString(board.seed)}</span> · {rules.name}
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden print:border-0 print:shadow-none">
        <HexBoard board={board} onHexTap={(i) => onBoardChange(toggleLock(board, i))} className="block" />
      </Card>

      {full && report && (
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Balance</CardTitle>
              <span
                className={cn(
                  "rounded-md px-2 py-1 font-display text-2xl font-bold tabular-nums",
                  report.score >= 85 ? "bg-forest/15 text-forest" : report.score >= 65 ? "bg-fields/25" : "bg-destructive/15 text-destructive",
                )}
                aria-label={`Balance score ${report.score} out of 100`}
              >
                {report.score}
              </span>
            </div>
            <CardDescription>
              Pips per resource, and how even they are per hex. {report.sameResourcePairs} same-resource pair{report.sameResourcePairs === 1 ? "" : "s"} touching,{" "}
              {report.sameNumberPairs} repeated number{report.sameNumberPairs === 1 ? "" : "s"} touching, {report.harborMismatches} strong 2:1 harbor
              {report.harborMismatches === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {RESOURCES.map((r) => {
                const max = Math.max(1, ...RESOURCES.map((x) => report.pips[x]));
                return (
                  <li key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-16 font-semibold">{RESOURCE_LABEL[r]}</span>
                    <div className="h-3 flex-1 rounded-full bg-muted" role="img" aria-label={`${RESOURCE_LABEL[r]} ${report.pips[r]} pips, ${report.pipsPerHex[r].toFixed(1)} per hex`}>
                      <div className={cn("h-full rounded-full", RESOURCE_BAR[r])} style={{ width: `${(report.pips[r] / max) * 100}%` }} />
                    </div>
                    <span className="w-20 text-right tabular-nums text-muted-foreground">
                      {report.pips[r]} · {report.pipsPerHex[r].toFixed(1)}/hex
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {tableView && <TableView board={board} onClose={() => setTableView(false)} />}
    </div>
  );
};

/**
 * Full-screen board for the middle of the table, sized to the shorter side
 * of the screen. Both islands are close to square, so rotation is a manual
 * option for phones propped sideways rather than an automatic one.
 */
const TableView = ({ board, onClose }: { board: Board; onClose: () => void }) => {
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sea print:hidden" role="dialog" aria-modal="true" aria-label="Table view">
      <div className={cn("flex items-center justify-center p-2", rotated ? "h-[100vw] w-[100vh] rotate-90" : "h-full w-full")}>
        <HexBoard board={board} className="h-full w-full" />
      </div>
      <div className="absolute right-3 top-3 flex gap-2 pt-[env(safe-area-inset-top)]">
        <Button variant="secondary" size="icon" onClick={() => setRotated((r) => !r)} aria-label="Rotate board">
          <RotateCw />
        </Button>
        <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close table view" autoFocus>
          <X />
        </Button>
      </div>
    </div>
  );
};
