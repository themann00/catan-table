/** Vibration pattern on devices that support it (Android Chrome). No-op elsewhere. */
export function buzz(pattern: number | number[] = 30): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when called without a user gesture. Ignore.
  }
}

/** Two sharp pulses: the robber is out. */
export const buzzRobber = () => buzz([60, 40, 60, 40, 120]);

/** Long celebratory pulse. */
export const buzzWin = () => buzz([40, 30, 40, 30, 200]);

/** Respects the OS "reduce motion" setting. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
