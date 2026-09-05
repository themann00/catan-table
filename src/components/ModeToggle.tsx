import { Segmented } from "@/components/Segmented";
import type { UiMode } from "@/lib/ui-state";

interface ModeToggleProps {
  mode: UiMode;
  onChange: (mode: UiMode) => void;
}

const OPTIONS = [
  { value: "game", label: "Game", hint: "Game mode: only what the table needs" },
  { value: "full", label: "Full", hint: "Full mode: adds stats and odds" },
] as const;

/** Game mode / Full mode segmented control in the header. */
export const ModeToggle = ({ mode, onChange }: ModeToggleProps) => (
  <Segmented value={mode} options={OPTIONS} onChange={onChange} label="Display mode" size="compact" />
);
