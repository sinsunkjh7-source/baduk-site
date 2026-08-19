import { useId, useMemo } from "react";
import type { Board, BoardRegion, Point } from "./types";
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
  /** Show only this sub-area of the board (e.g. a corner), instead of the full grid. */
  viewRegion?: BoardRegion;
}

/** Points for an upward-pointing triangle with circumradius r, centered at (cx, cy). */
function trianglePoints(cx: number, cy: number, r: number): string {
  return [-90, 30, 150]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    })
    .join(" ");
}

export function Goban({
  board,
  size,
  onPointClick,
  lastMove,
  showCoordinates = true,
  markers,
  moveNumbers,
  viewRegion,
}: GobanProps) {
  const viewSize = getViewSize(size);
  const starPoints = useMemo(() => getStarPoints(size), [size]);

  // Unique per instance so multiple boards on one page don't collide on gradient/filter ids.
  const uid = useId().replace(/:/g, "");
  const woodId = `wood-${uid}`;
  const grainId = `grain-${uid}`;
  const blackId = `black-${uid}`;
  const whiteId = `white-${uid}`;
  const highlightId = `highlight-${uid}`;
  const shadowId = `shadow-${uid}`;

  // A region suppresses coordinate labels — positioning them correctly against an
  // arbitrary crop isn't worth the complexity for what's meant to be a simple diagram.
  const effectiveShowCoordinates = showCoordinates && !viewRegion;

  const cropX = viewRegion ? toPixel(viewRegion.minX) - MARGIN : 0;
  const cropY = viewRegion ? toPixel(viewRegion.minY) - MARGIN : 0;
  const cropWidth = viewRegion ? toPixel(viewRegion.maxX) - toPixel(viewRegion.minX) + MARGIN * 2 : viewSize;
  const cropHeight = viewRegion ? toPixel(viewRegion.maxY) - toPixel(viewRegion.minY) + MARGIN * 2 : viewSize;

  const stoneRadius = CELL / 2 - 1.5;

  return (
    <svg viewBox={`${cropX} ${cropY} ${cropWidth} ${cropHeight}`} width={cropWidth} height={cropHeight}>
      <defs>
        <linearGradient id={woodId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c67d" />
          <stop offset="45%" stopColor="#dcb35c" />
          <stop offset="100%" stopColor="#c69a4c" />
        </linearGradient>

        <filter id={grainId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.15 0.008" numOctaves={4} seed={12} result="noise" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaMask" />
          <feComponentTransfer in="alphaMask" result="grainMask">
            <feFuncA type="gamma" amplitude={1} exponent={1.6} offset={0} />
          </feComponentTransfer>
          <feFlood floodColor="#4a2f12" floodOpacity={0.2} result="grainColor" />
          <feComposite in="grainColor" in2="grainMask" operator="in" />
        </filter>

        <radialGradient id={blackId} cx="32%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#767676" />
          <stop offset="35%" stopColor="#2e2e2e" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>

        <radialGradient id={whiteId} cx="30%" cy="26%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="#f7f4ec" />
          <stop offset="60%" stopColor="#dcd3b8" />
          <stop offset="100%" stopColor="#8f8570" />
        </radialGradient>

        <radialGradient id={highlightId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>

        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx={0.8} dy={1.4} stdDeviation={1} floodColor="#000000" floodOpacity={0.45} />
        </filter>
      </defs>

      {/* wood board background */}
      <rect x={0} y={0} width={viewSize} height={viewSize} fill={`url(#${woodId})`} />
      <rect x={0} y={0} width={viewSize} height={viewSize} fill="none" filter={`url(#${grainId})`} />

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
        <circle key={`star${p.x}-${p.y}`} cx={toPixel(p.x)} cy={toPixel(p.y)} r={4} fill="#3a2a15" />
      ))}

      {/* coordinates */}
      {effectiveShowCoordinates &&
        Array.from({ length: size }, (_, x) => (
          <text
            key={`colLabel${x}`}
            x={toPixel(x)}
            y={MARGIN / 2}
            fontSize={13}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#3a2a15"
          >
            {COLUMN_LETTERS[x]}
          </text>
        ))}
      {effectiveShowCoordinates &&
        Array.from({ length: size }, (_, y) => (
          <text
            key={`rowLabel${y}`}
            x={viewSize - MARGIN / 2}
            y={toPixel(y)}
            fontSize={13}
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
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={stoneRadius}
                    fill={cell === "black" ? `url(#${blackId})` : `url(#${whiteId})`}
                    stroke={cell === "white" ? "#8f8571" : "none"}
                    strokeWidth={0.75}
                    filter={`url(#${shadowId})`}
                    pointerEvents="none"
                  />
                  <ellipse
                    cx={cx - stoneRadius * 0.32}
                    cy={cy - stoneRadius * 0.38}
                    rx={stoneRadius * 0.46}
                    ry={stoneRadius * 0.34}
                    fill={`url(#${highlightId})`}
                    pointerEvents="none"
                  />
                  {cell === "white" && (
                    <circle
                      cx={cx - stoneRadius * 0.32}
                      cy={cy - stoneRadius * 0.38}
                      r={stoneRadius * 0.14}
                      fill="#ffffff"
                      opacity={0.95}
                      pointerEvents="none"
                    />
                  )}
                </>
              )}
              {lastMove && lastMove.x === x && lastMove.y === y && cell && (
                <polygon points={trianglePoints(cx, cy, 16)} fill="#2979ff" pointerEvents="none" />
              )}
            </g>
          );
        })
      )}

      {/* answer markers */}
      {markers?.map((p) => (
        <rect
          key={`marker${p.x}-${p.y}`}
          x={toPixel(p.x) - 8}
          y={toPixel(p.y) - 8}
          width={16}
          height={16}
          fill="none"
          stroke="#d92626"
          strokeWidth={3}
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
            fontSize={22}
            fontWeight={700}
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
