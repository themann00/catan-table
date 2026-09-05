import { Placeholder } from "@/components/Placeholder";
import type { UiMode } from "@/lib/ui-state";

export const RollTab = ({ mode }: { mode: UiMode }) => (
  <Placeholder
    title="Roll"
    description={mode === "full" ? "Dice, balanced deck, roll log, and histogram." : "Two dice and one big Roll button."}
    tier={2}
  />
);
