import { useReducer } from "react";
import * as MT from "./moveTree";
import type { Annotation, MoveTreeState } from "./types";
import type { Point, PlacementMode, StoneColor } from "../goban/types";

interface LectureState {
  tree: MoveTreeState;
  mode: PlacementMode;
  enforceRules: boolean;
  showMoveNumbers: boolean;
}

type Action =
  | { type: "PLACE"; point: Point; freeColor?: StoneColor }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "GO_START" }
  | { type: "GO_END" }
  | { type: "JUMP"; moveNumber: number }
  | { type: "GO_TO_NODE"; nodeId: string }
  | { type: "SET_MODE"; mode: PlacementMode }
  | { type: "SET_ENFORCE_RULES"; value: boolean }
  | { type: "ADD_ANNOTATION"; nodeId: string; annotation: Annotation }
  | { type: "REMOVE_ANNOTATION"; nodeId: string; annotationId: string }
  | { type: "CLEAR_ANNOTATIONS"; nodeId: string }
  | { type: "TOGGLE_MOVE_NUMBERS" }
  | { type: "RESET"; size?: number }
  | { type: "LOAD_TREE"; tree: MoveTreeState };

/** Derived from the current tree node, never stored — stays correct across undo/redo/branch switches. */
function nextColorFor(state: LectureState, freeColor?: StoneColor): StoneColor {
  if (state.mode === "fixedBlack") return "black";
  if (state.mode === "fixedWhite") return "white";
  if (freeColor) return freeColor;
  const lastMove = state.tree.nodes[state.tree.currentId].move;
  return lastMove?.color === "black" ? "white" : "black";
}

function initState(size: number): LectureState {
  return {
    tree: MT.createMoveTree(size),
    mode: "alternating",
    enforceRules: false,
    showMoveNumbers: false,
  };
}

function reducer(state: LectureState, action: Action): LectureState {
  switch (action.type) {
    case "PLACE": {
      const color = nextColorFor(state, action.freeColor);
      const tree = MT.playMove(state.tree, action.point, color, state.enforceRules);
      if (tree === state.tree) return state; // illegal move, no-op
      return { ...state, tree };
    }
    case "UNDO":
      return { ...state, tree: MT.undo(state.tree) };
    case "REDO":
      return { ...state, tree: MT.redo(state.tree) };
    case "GO_START":
      return { ...state, tree: MT.goToStart(state.tree) };
    case "GO_END":
      return { ...state, tree: MT.goToEnd(state.tree) };
    case "JUMP":
      return { ...state, tree: MT.jumpToMoveNumber(state.tree, action.moveNumber) };
    case "GO_TO_NODE":
      return { ...state, tree: MT.goToNode(state.tree, action.nodeId) };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_ENFORCE_RULES":
      return { ...state, enforceRules: action.value };
    case "ADD_ANNOTATION":
      return { ...state, tree: MT.addAnnotation(state.tree, action.nodeId, action.annotation) };
    case "REMOVE_ANNOTATION":
      return { ...state, tree: MT.removeAnnotation(state.tree, action.nodeId, action.annotationId) };
    case "CLEAR_ANNOTATIONS":
      return { ...state, tree: MT.clearAnnotations(state.tree, action.nodeId) };
    case "TOGGLE_MOVE_NUMBERS":
      return { ...state, showMoveNumbers: !state.showMoveNumbers };
    case "RESET":
      return initState(action.size ?? state.tree.size);
    case "LOAD_TREE":
      return { ...state, tree: action.tree };
    default:
      return state;
  }
}

export function useLectureBoard(initialSize: number) {
  const [state, dispatch] = useReducer(reducer, initialSize, initState);
  const { tree } = state;
  const currentNode = tree.nodes[tree.currentId];
  const ancestorPath = MT.getPathToRoot(tree, tree.currentId);
  const lineEndId = MT.getLineEnd(tree, tree.currentId);

  return {
    size: tree.size,
    tree,
    board: currentNode.board,
    lastMove: currentNode.move?.point ?? null,
    currentId: tree.currentId,
    moveNumber: ancestorPath.length - 1,
    lineEndMoveNumber: MT.getMoveNumber(tree, lineEndId),
    siblings: MT.getSiblings(tree, tree.currentId),
    annotations: currentNode.annotations,
    moveNumbers: state.showMoveNumbers ? MT.getMoveNumbersAlongPath(tree, tree.currentId) : undefined,
    showMoveNumbers: state.showMoveNumbers,
    mode: state.mode,
    enforceRules: state.enforceRules,
    nextColor: nextColorFor(state),

    place: (point: Point, freeColor?: StoneColor) => dispatch({ type: "PLACE", point, freeColor }),
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    goToStart: () => dispatch({ type: "GO_START" }),
    goToEnd: () => dispatch({ type: "GO_END" }),
    jumpToMoveNumber: (n: number) => dispatch({ type: "JUMP", moveNumber: n }),
    goToNode: (nodeId: string) => dispatch({ type: "GO_TO_NODE", nodeId }),
    setMode: (mode: PlacementMode) => dispatch({ type: "SET_MODE", mode }),
    setEnforceRules: (value: boolean) => dispatch({ type: "SET_ENFORCE_RULES", value }),
    addAnnotation: (annotation: Annotation) =>
      dispatch({ type: "ADD_ANNOTATION", nodeId: tree.currentId, annotation }),
    removeAnnotation: (annotationId: string) =>
      dispatch({ type: "REMOVE_ANNOTATION", nodeId: tree.currentId, annotationId }),
    clearAnnotations: () => dispatch({ type: "CLEAR_ANNOTATIONS", nodeId: tree.currentId }),
    toggleMoveNumbers: () => dispatch({ type: "TOGGLE_MOVE_NUMBERS" }),
    reset: (size?: number) => dispatch({ type: "RESET", size }),
    loadTree: (loadedTree: MoveTreeState) => dispatch({ type: "LOAD_TREE", tree: loadedTree }),
  };
}
