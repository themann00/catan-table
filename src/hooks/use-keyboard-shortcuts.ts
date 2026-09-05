import { useEffect, useRef } from "react";

export type ShortcutMap = Record<string, () => void>;

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

/**
 * Global single-key shortcuts. Ignored while typing in a field, while a
 * button has focus (its own Space/Enter would double-fire), while a dialog
 * is open, and when a modifier key is held. Keys are matched on
 * `event.key` ("Enter", " ", "r"), case-insensitive for letters.
 */
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true): void {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const handler = mapRef.current[key];
      if (!handler) return;

      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
