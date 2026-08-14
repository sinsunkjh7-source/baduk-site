export type StoneColor = "black" | "white";

export type Cell = StoneColor | null;

export type Board = Cell[][]; // board[y][x], y=0 is top row

export interface Point {
  x: number;
  y: number;
}

/** A rectangular sub-area of the board to display (inclusive grid coordinates). */
export interface BoardRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PlaceResult {
  board: Board;
  captured: Point[];
  legal: boolean;
}

export type PlacementMode = "fixedBlack" | "fixedWhite" | "alternating" | "free";
