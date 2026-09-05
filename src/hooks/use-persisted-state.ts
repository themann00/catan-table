import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { loadJSON, saveJSON } from "@/lib/storage";

/**
 * useState backed by localStorage. Reads once on mount through the
 * validator, writes on every change. Falls back to `initial` when the
 * stored value is missing or fails validation.
 */
export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
  validate: (v: unknown) => v is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = loadJSON(key, validate);
    if (stored !== null) return stored;
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => saveJSON(key, value), [key, value]);

  return [value, setValue];
}
