import type { Board, Point, StoneColor } from "../goban/types";

export interface MoveInfo {
  point: Point;
  color: StoneColor;
  captures: Point[];
}

export type Annotation =
  | { id: string; kind: "circle"; x: number; y: number }
  | { id: string; kind: "square"; x: number; y: number }
  | { id: string; kind: "arrow"; from: Point; to: Point }
  | { id: string; kind: "label"; x: number; y: number; text: string }
  | { id: string; kind: "highlight"; from: Point; to: Point };

export type AnnotationTool = "none" | "circle" | "square" | "arrow" | "label" | "highlight";

export interface MoveNode {
  id: string;
  parentId: string | null;
  /** null only for the root (empty board) node. */
  move: MoveInfo | null;
  board: Board;
  children: string[];
  annotations: Annotation[];
}

export interface MoveTreeState {
  size: number;
  nodes: Record<string, MoveNode>;
  rootId: string;
  currentId: string;
}
