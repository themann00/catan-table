import { useCallback, useEffect, useState } from "react";
import { loadJSON, saveJSON } from "@/lib/storage";

export type Theme = "light" | "dark";

const THEME_KEY = "theme:v1";
const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark";

function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light/dark theme. Starts from the saved choice, else the OS setting.
 * Applies the `dark` class Tailwind's darkMode: "class" expects.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() => loadJSON(THEME_KEY, isTheme) ?? systemTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#12212b" : "#1b3a4b");
    saveJSON(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
