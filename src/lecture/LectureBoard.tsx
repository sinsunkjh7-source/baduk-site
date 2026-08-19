import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Goban } from "../goban/Goban";
import { formatCoord, getViewSize } from "../goban/geometry";
import type { PlacementMode, Point, StoneColor } from "../goban/types";
import { AnnotationLayer } from "./AnnotationLayer";
import { useLectureBoard } from "./useLectureBoard";
import type { AnnotationTool } from "./types";
import { deleteScene, listScenes, saveScene, type Scene } from "./scenes";
import { playClickSound } from "../sound/soundSettings";
import "./LectureBoard.css";

const MODE_LABELS: Record<PlacementMode, string> = {
  fixedBlack: "흑 고정",
  fixedWhite: "백 고정",
  alternating: "교차 착수",
  free: "자유 선택",
};

const TOOL_LABELS: Record<AnnotationTool, string> = {
  none: "착수",
  circle: "원",
  square: "네모",
  arrow: "화살표",
  label: "텍스트 라벨",
  highlight: "영역 강조",
};

const TWO_CLICK_TOOLS: AnnotationTool[] = ["arrow", "highlight"];

const PLAY_SPEED_MS: Record<string, number> = {
  느리게: 2000,
  보통: 1200,
  빠르게: 600,
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.2;

export function LectureBoard() {
  const lecture = useLectureBoard(19);
  const [freeColor, setFreeColor] = useState<StoneColor>("black");
  const [tool, setTool] = useState<AnnotationTool>("none");
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null);
  const [jumpInput, setJumpInput] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<keyof typeof PLAY_SPEED_MS>("보통");
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const manuallyAdjustedRef = useRef(false);

  useEffect(() => {
    setScenes(listScenes());
  }, []);

  // "100%" only means the native pixel size, which is often too big to fit on screen.
  // So the default/reset zoom is instead computed to fit the space actually available —
  // measured from the real DOM (this row's width, the toolbar's own rendered height
  // below the board, the header's height) rather than guessed constants, and
  // re-measured on resize unless the user has zoomed manually. A small safety margin is
  // subtracted so rounding never lets the board spill past the edge.
  useLayoutEffect(() => {
    const SAFETY_MARGIN = 12;

    function computeFit(): number {
      const natural = getViewSize(lecture.size);
      const rootEl = rootRef.current;
      const toolbarEl = toolbarRef.current;

      const rootWidth = rootEl?.clientWidth ?? window.innerWidth;
      const rootStyle = rootEl ? getComputedStyle(rootEl) : null;
      const rootPadding = rootStyle ? parseFloat(rootStyle.paddingLeft) + parseFloat(rootStyle.paddingRight) : 0;
      const availableWidth = rootWidth - rootPadding - SAFETY_MARGIN;

      // Measuring from the root's own top (rather than summing header height + assumed
      // gaps) automatically accounts for whatever spacing sits above it, however the
      // surrounding layout is built.
      const rootTop = rootEl?.getBoundingClientRect().top ?? 64;
      const rootGap = rootStyle ? parseFloat(rootStyle.rowGap || rootStyle.gap || "0") || 0 : 0;
      const toolbarHeight = toolbarEl?.getBoundingClientRect().height ?? 0;
      const appRootEl = document.querySelector(".app-root");
      const appRootStyle = appRootEl ? getComputedStyle(appRootEl) : null;
      const appRootBottomPadding = appRootStyle ? parseFloat(appRootStyle.paddingBottom) || 0 : 0;
      const availableHeight =
        window.innerHeight - rootTop - rootGap - toolbarHeight - appRootBottomPadding - SAFETY_MARGIN;

      const fit = Math.min(1, availableWidth / natural, availableHeight / natural);
      return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit));
    }

    const initial = computeFit();
    setFitZoom(initial);
    setZoom(initial);

    function onResize() {
      const fit = computeFit();
      setFitZoom(fit);
      if (!manuallyAdjustedRef.current) setZoom(fit);
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // Re-run whenever toolbar content that changes its height appears/disappears, so the
    // fit stays accurate even without a window resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.size, lecture.mode, lecture.siblings.length, scenes.length, tool]);

  // Step-based autoplay: re-schedules one move at a time so it always reflects the
  // latest tree position (e.g. stops cleanly at the end of the current line).
  useEffect(() => {
    if (!isPlaying) return;
    if (lecture.moveNumber >= lecture.lineEndMoveNumber) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => lecture.redo(), PLAY_SPEED_MS[speed]);
    return () => window.clearTimeout(timer);
  }, [isPlaying, lecture.moveNumber, lecture.lineEndMoveNumber, speed]);

  function handlePointClick(p: Point) {
    if (tool === "none") {
      if (lecture.mode === "free") {
        lecture.place(p, freeColor);
      } else {
        lecture.place(p);
      }
      playClickSound();
      return;
    }

    if (tool === "circle" || tool === "square") {
      lecture.addAnnotation({ id: crypto.randomUUID(), kind: tool, x: p.x, y: p.y });
      return;
    }

    if (tool === "label") {
      const text = window.prompt("라벨 텍스트를 입력하세요");
      if (text) {
        lecture.addAnnotation({ id: crypto.randomUUID(), kind: "label", x: p.x, y: p.y, text });
      }
      return;
    }

    if (TWO_CLICK_TOOLS.includes(tool)) {
      if (!pendingPoint) {
        setPendingPoint(p);
      } else {
        lecture.addAnnotation({
          id: crypto.randomUUID(),
          kind: tool as "arrow" | "highlight",
          from: pendingPoint,
          to: p,
        });
        setPendingPoint(null);
      }
    }
  }

  function handleJump() {
    const n = Number(jumpInput);
    if (!Number.isNaN(n)) lecture.jumpToMoveNumber(n);
  }

  function handleSaveScene() {
    const name = window.prompt("저장할 장면 이름을 입력하세요");
    if (!name) return;
    saveScene(name, lecture.tree);
    setScenes(listScenes());
  }

  function handleLoadScene(scene: Scene) {
    setIsPlaying(false);
    lecture.loadTree(scene.tree);
  }

  function handleDeleteScene(id: string) {
    deleteScene(id);
    setScenes(listScenes());
  }

  return (
    <div className="lecture-board" ref={rootRef}>
      <div className="lecture-main">
        <div className="board-viewport" ref={viewportRef}>
          <div
            className="board-zoom-wrapper"
            style={{ width: getViewSize(lecture.size) * zoom, height: getViewSize(lecture.size) * zoom }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <Goban
                board={lecture.board}
                size={lecture.size}
                lastMove={lecture.lastMove}
                onPointClick={handlePointClick}
                moveNumbers={lecture.moveNumbers}
              />
              <AnnotationLayer size={lecture.size} annotations={lecture.annotations} pendingPoint={pendingPoint} />
            </div>
          </div>
        </div>
      </div>

      <div className="lecture-toolbar" ref={toolbarRef}>
        <div className="toolbar-group">
          <label>
            착수:
            <select value={lecture.mode} onChange={(e) => lecture.setMode(e.target.value as PlacementMode)}>
              {Object.entries(MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {lecture.mode === "free" && (
            <div className="free-color-toggle">
              {(["black", "white"] as const).map((c) => (
                <button key={c} className={freeColor === c ? "active" : ""} onClick={() => setFreeColor(c)}>
                  {c === "black" ? "흑" : "백"}
                </button>
              ))}
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={lecture.enforceRules}
              onChange={(e) => lecture.setEnforceRules(e.target.checked)}
            />
            착수 금지(자충수)
          </label>
          <label>
            <input type="checkbox" checked={lecture.showMoveNumbers} onChange={lecture.toggleMoveNumbers} />
            수순 번호
          </label>
        </div>

        <div className="toolbar-group">
          <button onClick={lecture.goToStart}>⏮</button>
          <button onClick={lecture.undo} disabled={lecture.moveNumber === 0}>
            ◀
          </button>
          <button onClick={lecture.redo} disabled={lecture.moveNumber === lecture.lineEndMoveNumber}>
            ▶
          </button>
          <button onClick={lecture.goToEnd}>⏭</button>
          <span className="move-count">
            {lecture.moveNumber}/{lecture.lineEndMoveNumber}
          </span>
          <input
            className="jump-input"
            type="number"
            min={0}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="수"
          />
          <button onClick={handleJump}>이동</button>
        </div>

        {lecture.siblings.length > 1 && (
          <div className="toolbar-group branch-list">
            분기:
            {lecture.siblings.map((siblingId) => {
              const node = lecture.tree.nodes[siblingId];
              const label = node.move
                ? `${node.move.color === "black" ? "흑" : "백"} ${formatCoord(node.move.point, lecture.size)}`
                : "시작";
              return (
                <button
                  key={siblingId}
                  className={siblingId === lecture.currentId ? "active" : ""}
                  onClick={() => lecture.goToNode(siblingId)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="toolbar-group">
          {(Object.keys(TOOL_LABELS) as AnnotationTool[]).map((t) => (
            <button
              key={t}
              className={tool === t ? "active" : ""}
              onClick={() => {
                setTool(t);
                setPendingPoint(null);
              }}
            >
              {TOOL_LABELS[t]}
            </button>
          ))}
          <button onClick={lecture.clearAnnotations} disabled={lecture.annotations.length === 0}>
            주석 지우기
          </button>
          {TWO_CLICK_TOOLS.includes(tool) && pendingPoint && <span>끝점 클릭</span>}
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => {
              manuallyAdjustedRef.current = true;
              setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(1)));
            }}
          >
            －
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => {
              manuallyAdjustedRef.current = true;
              setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(1)));
            }}
          >
            ＋
          </button>
          <button
            onClick={() => {
              manuallyAdjustedRef.current = false;
              setZoom(fitZoom);
            }}
          >
            화면 맞춤
          </button>
        </div>

        <div className="toolbar-group">
          <button onClick={handleSaveScene}>장면 저장</button>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            disabled={!isPlaying && lecture.moveNumber >= lecture.lineEndMoveNumber}
          >
            {isPlaying ? "⏸ 일시정지" : "▶ 자동재생"}
          </button>
          <select value={speed} onChange={(e) => setSpeed(e.target.value as keyof typeof PLAY_SPEED_MS)}>
            {Object.keys(PLAY_SPEED_MS).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {scenes.length > 0 && (
          <div className="toolbar-group scene-list">
            {scenes.map((scene) => (
              <span key={scene.id} className="scene-chip">
                {scene.name}
                <button onClick={() => handleLoadScene(scene)}>불러오기</button>
                <button onClick={() => handleDeleteScene(scene.id)}>삭제</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
