import { useState } from "react";
import { createEmptyBoard, placeStone } from "./boardLogic";
import type { Board, Point, StoneColor, PlacementMode } from "./types";

interface MoveEntry {
  point: Point;
  color: StoneColor;
}

interface GobanState {
  size: number;
  history: Board[];
  moves: (MoveEntry | null)[]; // moves[0] is always null (empty board)
  moveIndex: number;
  mode: PlacementMode;
  enforceRules: boolean;
}

function initState(size: number): GobanState {
  return {
    size,
    history: [createEmptyBoard(size)],
    moves: [null],
    moveIndex: 0,
    mode: "alternating",
    enforceRules: false,
  };
}

/** Derived from tree/history position, never stored — stays correct across undo/redo/mode switches. */
function nextColorFor(state: GobanState, freeColor?: StoneColor): StoneColor {
  if (state.mode === "fixedBlack") return "black";
  if (state.mode === "fixedWhite") return "white";
  if (freeColor) return freeColor;
  const lastMove = state.moves[state.moveIndex];
  return lastMove?.color === "black" ? "white" : "black";
}

export function useGoban(initialSize: number) {
  const [state, setState] = useState<GobanState>(() => initState(initialSize));

  const board = state.history[state.moveIndex];
  const lastMove = state.moves[state.moveIndex]?.point ?? null;

  function place(p: Point, freeColor?: StoneColor) {
    setState((prev) => {
      const curBoard = prev.history[prev.moveIndex];
      const color = nextColorFor(prev, freeColor);
      const result = placeStone(curBoard, p, color, prev.enforceRules);
      if (!result.legal) return prev;

      return {
        ...prev,
        history: [...prev.history.slice(0, prev.moveIndex + 1), result.board],
        moves: [...prev.moves.slice(0, prev.moveIndex + 1), { point: p, color }],
        moveIndex: prev.moveIndex + 1,
      };
    });
  }

  function undo() {
    setState((prev) => ({ ...prev, moveIndex: Math.max(0, prev.moveIndex - 1) }));
  }

  function redo() {
    setState((prev) => ({
      ...prev,
      moveIndex: Math.min(prev.history.length - 1, prev.moveIndex + 1),
    }));
  }

  function jumpTo(index: number) {
    setState((prev) => ({
      ...prev,
      moveIndex: Math.max(0, Math.min(prev.history.length - 1, index)),
    }));
  }

  function reset(newSize?: number) {
    setState((prev) => initState(newSize ?? prev.size));
  }

  function setMode(mode: PlacementMode) {
    setState((prev) => ({ ...prev, mode }));
  }

  function setEnforceRules(enforceRules: boolean) {
    setState((prev) => ({ ...prev, enforceRules }));
  }

  return {
    size: state.size,
    board,
    lastMove,
    moveIndex: state.moveIndex,
    moveCount: state.history.length - 1,
    mode: state.mode,
    setMode,
    enforceRules: state.enforceRules,
    setEnforceRules,
    nextColor: nextColorFor(state),
    place,
    undo,
    redo,
    jumpTo,
    reset,
  };
}
