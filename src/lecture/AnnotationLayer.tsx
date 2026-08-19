import { toPixel, getViewSize } from "../goban/geometry";
import type { Point } from "../goban/types";
import type { Annotation } from "./types";

interface ArrowProps {
  id: string;
  from: Point;
  to: Point;
}

function ArrowMark({ id, from, to }: ArrowProps) {
  const markerId = `arrowhead-${id}`;
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth={10} markerHeight={10} refX={7} refY={5} orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="#c0392b" />
        </marker>
      </defs>
      <line
        x1={toPixel(from.x)}
        y1={toPixel(from.y)}
        x2={toPixel(to.x)}
        y2={toPixel(to.y)}
        stroke="#c0392b"
        strokeWidth={3.5}
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
}

interface AnnotationLayerProps {
  size: number;
  annotations: Annotation[];
  pendingPoint?: Point | null;
}

export function AnnotationLayer({ size, annotations, pendingPoint }: AnnotationLayerProps) {
  const viewSize = getViewSize(size);
  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      width={viewSize}
      height={viewSize}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {annotations.map((a) => {
        switch (a.kind) {
          case "circle":
            return (
              <circle
                key={a.id}
                cx={toPixel(a.x)}
                cy={toPixel(a.y)}
                r={14}
                fill="none"
                stroke="#1e6fd9"
                strokeWidth={3.5}
              />
            );
          case "square":
            return (
              <rect
                key={a.id}
                x={toPixel(a.x) - 12}
                y={toPixel(a.y) - 12}
                width={24}
                height={24}
                fill="none"
                stroke="#1e6fd9"
                strokeWidth={3.5}
              />
            );
          case "label":
            return (
              <g key={a.id}>
                <circle cx={toPixel(a.x)} cy={toPixel(a.y)} r={15} fill="#fff" stroke="#1e6fd9" strokeWidth={2} />
                <text
                  x={toPixel(a.x)}
                  y={toPixel(a.y)}
                  fontSize={13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1e6fd9"
                >
                  {a.text}
                </text>
              </g>
            );
          case "arrow":
            return <ArrowMark key={a.id} id={a.id} from={a.from} to={a.to} />;
          case "highlight": {
            const x1 = Math.min(a.from.x, a.to.x);
            const x2 = Math.max(a.from.x, a.to.x);
            const y1 = Math.min(a.from.y, a.to.y);
            const y2 = Math.max(a.from.y, a.to.y);
            return (
              <rect
                key={a.id}
                x={toPixel(x1) - 22}
                y={toPixel(y1) - 22}
                width={toPixel(x2) - toPixel(x1) + 44}
                height={toPixel(y2) - toPixel(y1) + 44}
                fill="rgba(255, 214, 0, 0.25)"
                stroke="#e0b800"
                strokeWidth={3}
              />
            );
          }
          default:
            return null;
        }
      })}
      {pendingPoint && <circle cx={toPixel(pendingPoint.x)} cy={toPixel(pendingPoint.y)} r={8} fill="#e08a1e" />}
    </svg>
  );
}
