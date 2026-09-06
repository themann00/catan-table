import { useCallback, useEffect, useRef, useState } from "react";
import { decodeBoard, generateBoard, isBoard, type Board } from "@/lib/board";
import { loadJSON, saveJSON } from "@/lib/storage";

const BOARD_KEY = "board:v1";
export const BOARD_URL_PARAM = "b";

/** A board from the current URL's `?b=` parameter, if it decodes. */
function boardFromUrl(): Board | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(BOARD_URL_PARAM);
  return raw ? decodeBoard(raw) : null;
}

/**
 * The generated board, shared between the Board and Odds tabs. A `?b=`
 * link wins over the saved board on load. The address bar stays clean
 * otherwise: the Share button builds the link, and once the visitor
 * changes the board the stale `?b=` is dropped so a reload shows their
 * board, not the shared one.
 */
export function useBoard(): [Board, (board: Board) => void] {
  const [board, setBoardState] = useState<Board>(
    () => boardFromUrl() ?? loadJSON(BOARD_KEY, isBoard) ?? generateBoard({ layout: "base", mode: "random" }),
  );
  const first = useRef(true);

  useEffect(() => {
    saveJSON(BOARD_KEY, board);
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window === "undefined" || typeof history.replaceState !== "function") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(BOARD_URL_PARAM)) return;
    url.searchParams.delete(BOARD_URL_PARAM);
    history.replaceState(null, "", url);
  }, [board]);

  const setBoard = useCallback((next: Board) => setBoardState(next), []);
  return [board, setBoard];
}
