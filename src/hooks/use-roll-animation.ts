import { useCallback, useEffect, useRef, useState } from "react";
import { rollDice, type DicePair } from "@/lib/dice";

const ROLL_MS = 650;
const FRAME_MS = 90;

/**
 * Tumbles placeholder dice for a moment, then calls `onSettle`. Returns the
 * current placeholder (null when idle). Timers are cleared on unmount.
 */
export function useRollAnimation(enabled: boolean): {
  rolling: DicePair | null;
  start: (onSettle: () => void) => void;
} {
  const [rolling, setRolling] = useState<DicePair | null>(null);
  const timers = useRef<{ interval: number | null; timeout: number | null }>({ interval: null, timeout: null });

  const clear = useCallback(() => {
    const t = timers.current;
    if (t.interval !== null) clearInterval(t.interval);
    if (t.timeout !== null) clearTimeout(t.timeout);
    t.interval = null;
    t.timeout = null;
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (onSettle: () => void) => {
      if (!enabled) {
        onSettle();
        return;
      }
      clear();
      setRolling(rollDice());
      timers.current.interval = window.setInterval(() => setRolling(rollDice()), FRAME_MS);
      timers.current.timeout = window.setTimeout(() => {
        clear();
        setRolling(null);
        onSettle();
      }, ROLL_MS);
    },
    [enabled, clear],
  );

  return { rolling, start };
}
