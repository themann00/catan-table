import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake while `active` is true, so the phone does not
 * lock mid-game on the table. Re-acquires after the tab returns to the
 * foreground (browsers release the lock on visibility change).
 * Silently does nothing where the Screen Wake Lock API is unavailable.
 */
export function useWakeLock(active: boolean): void {
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        sentinel.current = await navigator.wakeLock.request("screen");
      } catch {
        // Denied (low battery, permissions policy). Not worth surfacing.
        sentinel.current = null;
      }
    };

    const release = () => {
      sentinel.current?.release().catch(() => undefined);
      sentinel.current = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [active]);
}
