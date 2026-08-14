import { useEffect, useState } from "react";
import { Goban } from "../goban/Goban";
import { formatCoord } from "../goban/geometry";
import type { PlacementMode, Point, StoneColor } from "../goban/types";
import { AnnotationLayer } from "./AnnotationLayer";
import { useLectureBoard } from "./useLectureBoard";
import type { AnnotationTool } from "./types";
import { deleteScene, listScenes, saveScene, type Scene } from "./scenes";
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
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<keyof typeof PLAY_SPEED_MS>("보통");

  useEffect(() => {
    setScenes(listScenes());
  }, []);

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
    <div className="lecture-board">
      <div className="controls">
        <label>
          착수 방식:
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
          규칙 검증 (자충수 금지)
        </label>

        <label>
          <input type="checkbox" checked={lecture.showMoveNumbers} onChange={lecture.toggleMoveNumbers} />
          수순 번호 표시
        </label>
      </div>

      <div className="controls">
        <button onClick={lecture.goToStart}>⏮ 처음으로</button>
        <button onClick={lecture.undo} disabled={lecture.moveNumber === 0}>
          ◀ 되돌리기
        </button>
        <button onClick={lecture.redo} disabled={lecture.moveNumber === lecture.lineEndMoveNumber}>
          다시 실행 ▶
        </button>
        <button onClick={lecture.goToEnd}>마지막으로 ⏭</button>

        <span className="move-count">
          수: {lecture.moveNumber} / {lecture.lineEndMoveNumber}
        </span>

        <input
          className="jump-input"
          type="number"
          min={0}
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          placeholder="수 번호"
        />
        <button onClick={handleJump}>이동</button>
      </div>

      {lecture.siblings.length > 1 && (
        <div className="controls branch-list">
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

      <div className="controls">
        주석 도구:
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
          이 장면 주석 지우기
        </button>
        {TWO_CLICK_TOOLS.includes(tool) && pendingPoint && <span>끝점을 클릭하세요</span>}
      </div>

      <div className="controls">
        확대/축소:
        <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(1)))}>－</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(1)))}>＋</button>
        <button onClick={() => setZoom(1)}>리셋</button>
      </div>

      <div className="controls">
        <button onClick={handleSaveScene}>현재 장면 저장</button>

        <button
          onClick={() => setIsPlaying((p) => !p)}
          disabled={!isPlaying && lecture.moveNumber >= lecture.lineEndMoveNumber}
        >
          {isPlaying ? "⏸ 일시정지" : "▶ 자동 재생"}
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
        <ul className="scene-list">
          {scenes.map((scene) => (
            <li key={scene.id}>
              <span>{scene.name}</span>
              <button onClick={() => handleLoadScene(scene)}>불러오기</button>
              <button onClick={() => handleDeleteScene(scene.id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}

      <div className="board-viewport">
        <div
          className="board-zoom-wrapper"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
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
  );
}
