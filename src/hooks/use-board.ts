import { useCallback, useEffect, useState } from "react";
import { decodeBoard, encodeBoard, generateBoard, isBoard, type Board } from "@/lib/board";
import { loadJSON, saveJSON } from "@/lib/storage";

const BOARD_KEY = "board:v1";
const URL_PARAM = "b";

/** A board from the current URL's `?b=` parameter, if it decodes. */
function boardFromUrl(): Board | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
  return raw ? decodeBoard(raw) : null;
}

/**
 * The generated board, shared between the Board and Odds tabs. A `?b=`
 * link wins over the saved board; every change is written back to both
 * localStorage and the address bar (replaceState, so no history spam).
 */
export function useBoard(): [Board, (board: Board) => void] {
  const [board, setBoardState] = useState<Board>(
    () => boardFromUrl() ?? loadJSON(BOARD_KEY, isBoard) ?? generateBoard({ layout: "base", mode: "random" }),
  );

  useEffect(() => {
    saveJSON(BOARD_KEY, board);
    if (typeof window === "undefined" || typeof history.replaceState !== "function") return;
    const url = new URL(window.location.href);
    const encoded = encodeBoard(board);
    if (url.searchParams.get(URL_PARAM) === encoded) return;
    url.searchParams.set(URL_PARAM, encoded);
    history.replaceState(null, "", url);
  }, [board]);

  const setBoard = useCallback((next: Board) => setBoardState(next), []);
  return [board, setBoard];
}
