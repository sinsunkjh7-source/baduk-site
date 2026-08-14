import type { Point } from "./types";

/** Standard hoshi (star point) layouts for common board sizes. */
export function getStarPoints(size: number): Point[] {
  if (size === 19) {
    const edge = [3, 9, 15];
    return edge.flatMap((y) => edge.map((x) => ({ x, y })));
  }
  if (size === 13) {
    const edge = [3, 9];
    const pts = edge.flatMap((y) => edge.map((x) => ({ x, y })));
    pts.push({ x: 6, y: 6 });
    return pts;
  }
  if (size === 9) {
    return [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 4, y: 4 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
    ];
  }
  return [];
}
