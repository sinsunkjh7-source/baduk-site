import { useMemo } from "react";
import type { Board, Point } from "./types";
import { getStarPoints } from "./starPoints";
import { MARGIN, CELL, COLUMN_LETTERS, toPixel, getViewSize } from "./geometry";

export interface NumberedPoint extends Point {
  number: number;
}

interface GobanProps {
  board: Board;
  size: number;
  onPointClick?: (p: Point) => void;
  lastMove?: Point | null;
  showCoordinates?: boolean;
  markers?: Point[];
  moveNumbers?: NumberedPoint[];
}

export function Goban({
  board,
  size,
  onPointClick,
  lastMove,
  showCoordinates = true,
  markers,
  moveNumbers,
}: GobanProps) {
  const viewSize = getViewSize(size);
  const starPoints = useMemo(() => getStarPoints(size), [size]);

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      width={viewSize}
      height={viewSize}
      style={{ background: "#dcb35c" }}
    >
      {/* grid lines */}
      {Array.from({ length: size }, (_, i) => (
        <line
          key={`h${i}`}
          x1={toPixel(0)}
          y1={toPixel(i)}
          x2={toPixel(size - 1)}
          y2={toPixel(i)}
          stroke="#3a2a15"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: size }, (_, i) => (
        <line
          key={`v${i}`}
          x1={toPixel(i)}
          y1={toPixel(0)}
          x2={toPixel(i)}
          y2={toPixel(size - 1)}
          stroke="#3a2a15"
          strokeWidth={1}
        />
      ))}

      {/* star points */}
      {starPoints.map((p) => (
        <circle key={`star${p.x}-${p.y}`} cx={toPixel(p.x)} cy={toPixel(p.y)} r={3} fill="#3a2a15" />
      ))}

      {/* coordinates */}
      {showCoordinates &&
        Array.from({ length: size }, (_, x) => (
          <text
            key={`colLabel${x}`}
            x={toPixel(x)}
            y={MARGIN / 2}
            fontSize={12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#3a2a15"
          >
            {COLUMN_LETTERS[x]}
          </text>
        ))}
      {showCoordinates &&
        Array.from({ length: size }, (_, y) => (
          <text
            key={`rowLabel${y}`}
            x={viewSize - MARGIN / 2}
            y={toPixel(y)}
            fontSize={12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#3a2a15"
          >
            {size - y}
          </text>
        ))}

      {/* click targets + stones */}
      {board.map((row, y) =>
        row.map((cell, x) => {
          const key = `${x}-${y}`;
          const cx = toPixel(x);
          const cy = toPixel(y);
          return (
            <g key={key}>
              <rect
                x={cx - CELL / 2}
                y={cy - CELL / 2}
                width={CELL}
                height={CELL}
                fill="transparent"
                onClick={() => onPointClick?.({ x, y })}
                style={{ cursor: onPointClick ? "pointer" : "default" }}
              />
              {cell && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL / 2 - 1.5}
                  fill={cell === "black" ? "#1a1a1a" : "#f5f5f0"}
                  stroke={cell === "white" ? "#555" : "none"}
                  strokeWidth={1}
                  pointerEvents="none"
                />
              )}
              {lastMove && lastMove.x === x && lastMove.y === y && cell && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="none"
                  stroke={cell === "black" ? "#f5f5f0" : "#1a1a1a"}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })
      )}

      {/* answer markers */}
      {markers?.map((p) => (
        <rect
          key={`marker${p.x}-${p.y}`}
          x={toPixel(p.x) - 6}
          y={toPixel(p.y) - 6}
          width={12}
          height={12}
          fill="none"
          stroke="#d92626"
          strokeWidth={2}
          pointerEvents="none"
        />
      ))}

      {/* move numbers */}
      {moveNumbers?.map((p) => {
        const cell = board[p.y][p.x];
        return (
          <text
            key={`num${p.x}-${p.y}`}
            x={toPixel(p.x)}
            y={toPixel(p.y)}
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={cell === "black" ? "#f5f5f0" : "#1a1a1a"}
            pointerEvents="none"
          >
            {p.number}
          </text>
        );
      })}
    </svg>
  );
}
