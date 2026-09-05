/** m:ss from milliseconds, never negative. */
export const formatElapsed = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
};

/** 0.1234 -> "12%" */
export const formatPercent = (p: number, digits = 0): string => `${(p * 100).toFixed(digits)}%`;
