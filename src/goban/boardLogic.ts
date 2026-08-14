import type { Board, Cell, Point, PlaceResult, StoneColor } from "./types";

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array<Cell>(size).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function inBounds(board: Board, p: Point): boolean {
  return p.y >= 0 && p.y < board.length && p.x >= 0 && p.x < board[0].length;
}

function neighbors(board: Board, p: Point): Point[] {
  const candidates = [
    { x: p.x - 1, y: p.y },
    { x: p.x + 1, y: p.y },
    { x: p.x, y: p.y - 1 },
    { x: p.x, y: p.y + 1 },
  ];
  return candidates.filter((n) => inBounds(board, n));
}

/** Connected group of same-colored stones starting at p (p must be occupied). */
export function getGroup(board: Board, p: Point): Point[] {
  const color = board[p.y][p.x];
  if (!color) return [];
  const visited = new Set<string>();
  const stack = [p];
  const group: Point[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    const key = `${cur.x},${cur.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    group.push(cur);
    for (const n of neighbors(board, cur)) {
      if (board[n.y][n.x] === color && !visited.has(`${n.x},${n.y}`)) {
        stack.push(n);
      }
    }
  }
  return group;
}

export function getLiberties(board: Board, group: Point[]): number {
  const liberties = new Set<string>();
  for (const p of group) {
    for (const n of neighbors(board, p)) {
      if (board[n.y][n.x] === null) liberties.add(`${n.x},${n.y}`);
    }
  }
  return liberties.size;
}

function opposite(color: StoneColor): StoneColor {
  return color === "black" ? "white" : "black";
}

/**
 * Place a stone and resolve captures.
 * enforceRules=true rejects occupied points and suicide moves (illegal=false, board unchanged).
 * enforceRules=false only rejects occupied points; suicide stones are placed as-is.
 */
export function placeStone(
  board: Board,
  p: Point,
  color: StoneColor,
  enforceRules: boolean
): PlaceResult {
  if (!inBounds(board, p) || board[p.y][p.x] !== null) {
    return { board, captured: [], legal: false };
  }

  const next = cloneBoard(board);
  next[p.y][p.x] = color;

  const captured: Point[] = [];
  const seen = new Set<string>();
  for (const n of neighbors(next, p)) {
    const key = `${n.x},${n.y}`;
    if (seen.has(key)) continue;
    if (next[n.y][n.x] === opposite(color)) {
      const group = getGroup(next, n);
      group.forEach((g) => seen.add(`${g.x},${g.y}`));
      if (getLiberties(next, group) === 0) {
        for (const g of group) {
          next[g.y][g.x] = null;
          captured.push(g);
        }
      }
    }
  }

  const ownGroup = getGroup(next, p);
  const isSuicide = getLiberties(next, ownGroup) === 0;

  if (isSuicide && enforceRules) {
    return { board, captured: [], legal: false };
  }

  return { board: next, captured, legal: true };
}
