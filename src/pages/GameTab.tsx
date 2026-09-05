import { Placeholder } from "@/components/Placeholder";
import type { UiMode } from "@/lib/ui-state";

export const GameTab = ({ mode }: { mode: UiMode }) => (
  <Placeholder
    title="Game"
    description={
      mode === "full"
        ? "Players, victory points, dev card odds, timer, and game history."
        : "Players, victory points, and the dev card tracker."
    }
    tier={3}
  />
);
