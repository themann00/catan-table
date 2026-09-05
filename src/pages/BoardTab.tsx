import { Placeholder } from "@/components/Placeholder";
import type { UiMode } from "@/lib/ui-state";

export const BoardTab = ({ mode }: { mode: UiMode }) => (
  <Placeholder
    title="Board"
    description={
      mode === "full"
        ? "Random and balanced setups with a balance score and pip totals."
        : "Random and balanced setups for 19 or 30 hexes."
    }
    tier={5}
  />
);
