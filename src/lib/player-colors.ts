import type { PlayerColor } from "./rules";

/** Piece colors from the box. White gets a border so it reads on parchment. */
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red: "#c0392b",
  blue: "#2563eb",
  orange: "#f97316",
  white: "#f5f5f4",
  green: "#16a34a",
  brown: "#6b4423",
};

export const PLAYER_COLOR_LABEL: Record<PlayerColor, string> = {
  red: "Red",
  blue: "Blue",
  orange: "Orange",
  white: "White",
  green: "Green",
  brown: "Brown",
};

/** Text color that stays legible on the swatch. */
export const PLAYER_COLOR_INK: Record<PlayerColor, string> = {
  red: "#fff",
  blue: "#fff",
  orange: "#1c1917",
  white: "#1c1917",
  green: "#fff",
  brown: "#fff",
};
