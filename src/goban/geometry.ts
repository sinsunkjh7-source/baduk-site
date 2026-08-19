import type { Point } from "./types";

export const MARGIN = 36;
export const CELL = 40;

/** Conventional Go column labels — skips "I" to avoid confusion with "1". */
export const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRST";

export function toPixel(v: number): number {
  return MARGIN + v * CELL;
}

export function getViewSize(size: number): number {
  return CELL * (size - 1) + MARGIN * 2;
}

/** Inverse of toPixel, rounded to the nearest grid intersection. */
export function toGrid(pixel: number): number {
  return Math.round((pixel - MARGIN) / CELL);
}

/** e.g. {x:3, y:15} on a 19-line board -> "D4" */
export function formatCoord(p: Point, size: number): string {
  return `${COLUMN_LETTERS[p.x]}${size - p.y}`;
}
