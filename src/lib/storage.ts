/**
 * localStorage with the failure modes handled: private mode, quota,
 * corrupted JSON, and data from an older schema. Every read is validated.
 */

const PREFIX = "catan-table:";

export function loadJSON<T>(key: string, validate: (value: unknown) => value is T): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled. The app works without it.
  }
}

export function removeJSON(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Storage disabled. Nothing to remove.
  }
}

/* Small validators shared by the persisted slices. */
export const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
export const isString = (v: unknown): v is string => typeof v === "string";
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
export const isArrayOf =
  <T>(item: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(item);
export const isOneOf =
  <const T extends readonly unknown[]>(options: T) =>
  (v: unknown): v is T[number] =>
    options.includes(v);
