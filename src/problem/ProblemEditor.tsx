import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Goban } from "../goban/Goban";
import { createEmptyBoard } from "../goban/boardLogic";
import { MARGIN, getViewSize, toPixel } from "../goban/geometry";
import type { Board, BoardRegion, Point, StoneColor } from "../goban/types";
import type { InitialStone, Problem } from "./types";
import { units } from "../curriculum/units";
import { useProblems } from "./store";
import { saveNewProblem, saveExistingProblem, removeProblem } from "./store";
import { getProblemsByLevel } from "./data";
import "./ProblemEditor.css";

type StoneMode = "black" | "white" | "erase" | "answer" | "region";

const SIZES = [9, 13, 19] as const;
const FULL_SIZE = 19;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.2;

// The 19-line board's on-screen footprint (at fit-to-screen 100%) is the fixed reference
// frame. 9-line and 13-line boards are scaled up to fill that exact same frame — same
// outer size, wider line spacing — rather than each size computing its own independent fit.
const REFERENCE_SIZE = getViewSize(FULL_SIZE);

function boardToStones(board: Board): InitialStone[] {
  const stones: InitialStone[] = [];
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) stones.push({ x, y, color: cell });
    })
  );
  return stones;
}

function nextSequence(problems: Problem[], unitId: string, levelId: string): number {
  const existing = getProblemsByLevel(problems, unitId, levelId);
  return existing.reduce((max, p) => Math.max(max, p.location.sequence), 0) + 1;
}

/** Natural (unscaled) pixel size of the board as currently displayed — the full grid, or
 * just the cropped region when one is set. */
function naturalDims(size: number, region: BoardRegion | null): { width: number; height: number } {
  if (!region) {
    const v = getViewSize(size);
    return { width: v, height: v };
  }
  return {
    width: toPixel(region.maxX) - toPixel(region.minX) + MARGIN * 2,
    height: toPixel(region.maxY) - toPixel(region.minY) + MARGIN * 2,
  };
}

export function ProblemEditor() {
  const { problems, loading } = useProblems();
  const problemUnits = units.map((u) => ({ ...u, levels: u.levels.filter((l) => l.kind === "problem") }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState(problemUnits[0]?.id ?? "");
  const [levelId, setLevelId] = useState(problemUnits[0]?.levels[0]?.id ?? "");
  const [sequence, setSequence] = useState(1);
  const [title, setTitle] = useState("");
  const [size, setSize] = useState<number>(19);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(19));
  const [playerColor, setPlayerColor] = useState<StoneColor>("white");
  const [correctPoints, setCorrectPoints] = useState<Point[]>([]);
  const [region, setRegion] = useState<BoardRegion | null>(null);
  const [previewFullBoard, setPreviewFullBoard] = useState(false);
  const [mode, setMode] = useState<StoneMode>("black");
  const [pendingCorner, setPendingCorner] = useState<Point | null>(null);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const manuallyAdjustedRef = useRef(false);

  // Suggest the next free sequence number whenever unit/level changes for a *new* problem.
  useEffect(() => {
    if (editingId) return;
    setSequence(nextSequence(problems, unitId, levelId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, levelId, problems, editingId]);

  const effectiveRegion = region && !previewFullBoard ? region : undefined;
  const natural = naturalDims(size, effectiveRegion ?? null);

  // `zoom` is the fit level of the fixed 19-line reference frame (not of whatever size is
  // currently selected) — computed once from real screen/toolbar measurements, independent
  // of which board size is selected. Every size then derives its own render scale from
  // this same frame below, so switching sizes can never change the frame's pixel footprint.
  useLayoutEffect(() => {
    const SAFETY_MARGIN = 16;

    function computeFit(): number {
      const rootEl = rootRef.current;
      const toolbarEl = toolbarRef.current;

      // A vertical scrollbar (Windows/Linux non-overlay style) steals width from the right
      // edge without shrinking window.innerWidth. If one is already showing, clientWidth
      // already excludes it; if computeFit runs before it appears (e.g. this same reflow is
      // about to introduce one), account for it explicitly so the board doesn't get sized
      // for space that's about to disappear out from under it.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      const rootWidth = rootEl?.clientWidth ?? window.innerWidth;
      const rootStyle = rootEl ? getComputedStyle(rootEl) : null;
      const rootPadding = rootStyle ? parseFloat(rootStyle.paddingLeft) + parseFloat(rootStyle.paddingRight) : 0;
      const availableWidth = rootWidth - rootPadding - scrollbarWidth - SAFETY_MARGIN;

      const rootTop = rootEl?.getBoundingClientRect().top ?? 64;
      const rootGap = rootStyle ? parseFloat(rootStyle.rowGap || rootStyle.gap || "0") || 0 : 0;
      const toolbarHeight = toolbarEl?.getBoundingClientRect().height ?? 0;
      const appRootEl = document.querySelector(".app-root");
      const appRootStyle = appRootEl ? getComputedStyle(appRootEl) : null;
      const appRootBottomPadding = appRootStyle ? parseFloat(appRootStyle.paddingBottom) || 0 : 0;
      const availableHeight =
        window.innerHeight - rootTop - rootGap - toolbarHeight - appRootBottomPadding - SAFETY_MARGIN;

      const fit = Math.min(availableWidth / REFERENCE_SIZE, availableHeight / REFERENCE_SIZE);
      return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit));
    }

    function apply() {
      const fit = computeFit();
      setFitZoom(fit);
      if (!manuallyAdjustedRef.current) setZoom(fit);
    }

    apply();
    window.addEventListener("resize", apply);
    // Also react to the toolbar's own size changes (e.g. it wrapping onto more rows as the
    // unit/level/problem-list content changes) rather than only window resize events —
    // otherwise a self-inflicted layout shift never gets re-measured.
    const observer = new ResizeObserver(apply);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    return () => {
      window.removeEventListener("resize", apply);
      observer.disconnect();
    };
    // Deliberately NOT keyed on size/region/natural — the reference frame is fixed to the
    // 19-line board, so selecting a different size must never trigger a recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems.length, loading]);

  // The fixed on-screen frame (in pixels) that every board size renders into.
  const frameSize = REFERENCE_SIZE * zoom;
  // How much the *currently selected* size/region must be scaled to exactly fill that frame.
  const renderScale = Math.min(frameSize / natural.width, frameSize / natural.height);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBoard(createEmptyBoard(size));
    setCorrectPoints([]);
    setRegion(null);
    setPendingCorner(null);
    setPreviewFullBoard(false);
    setMode("black");
    setSequence(nextSequence(problems, unitId, levelId));
    setMessage("");
  }

  function handleSizeChange(newSize: number) {
    setSize(newSize);
    setBoard(createEmptyBoard(newSize));
    setCorrectPoints([]);
    setRegion(null);
    setPendingCorner(null);
    manuallyAdjustedRef.current = false;
  }

  function handleBoardClick(p: Point) {
    if (mode === "region") {
      if (!pendingCorner) {
        setPendingCorner(p);
        return;
      }
      setRegion({
        minX: Math.min(pendingCorner.x, p.x),
        minY: Math.min(pendingCorner.y, p.y),
        maxX: Math.max(pendingCorner.x, p.x),
        maxY: Math.max(pendingCorner.y, p.y),
      });
      setPendingCorner(null);
      return;
    }

    if (mode === "answer") {
      if (board[p.y][p.x] !== null) return;
      setCorrectPoints((prev) =>
        prev.some((cp) => cp.x === p.x && cp.y === p.y)
          ? prev.filter((cp) => !(cp.x === p.x && cp.y === p.y))
          : [...prev, p]
      );
      return;
    }

    const nextCell = mode === "erase" ? null : mode;
    setBoard((prev) => {
      const next = prev.map((row) => row.slice());
      next[p.y][p.x] = nextCell;
      return next;
    });
    if (nextCell !== null) {
      setCorrectPoints((prev) => prev.filter((cp) => !(cp.x === p.x && cp.y === p.y)));
    }
  }

  function loadForEdit(p: Problem) {
    setEditingId(p.id);
    setUnitId(p.location.unitId);
    setLevelId(p.location.levelId);
    setSequence(p.location.sequence);
    setTitle(p.title);
    setSize(p.size);
    const b = createEmptyBoard(p.size);
    p.initialStones.forEach((s) => {
      b[s.y][s.x] = s.color;
    });
    setBoard(b);
    setPlayerColor(p.playerColor);
    setCorrectPoints(p.correctPoints);
    setRegion(p.region ?? null);
    setPreviewFullBoard(false);
    setPendingCorner(null);
    setMode("black");
    setMessage("");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 문제를 삭제할까요?")) return;
    await removeProblem(id);
    if (editingId === id) resetForm();
  }

  async function handleSave() {
    if (!title.trim()) {
      setMessage("제목을 입력하세요.");
      return;
    }
    if (correctPoints.length === 0) {
      setMessage("정답 지점을 최소 한 곳 지정하세요.");
      return;
    }
    const problem: Problem = {
      id: editingId ?? `${unitId}-${levelId}-${String(sequence).padStart(2, "0")}`,
      location: { unitId, levelId, sequence },
      title: title.trim(),
      size,
      region: region ?? undefined,
      initialStones: boardToStones(board),
      playerColor,
      correctPoints,
    };
    if (editingId) {
      await saveExistingProblem(problem);
    } else {
      await saveNewProblem(problem);
    }
    setMessage(editingId ? "수정했습니다." : "저장했습니다.");
    resetForm();
  }

  const levelProblems = getProblemsByLevel(problems, unitId, levelId);

  return (
    <div className="problem-editor" ref={rootRef}>
      <div className="editor-main">
        <div
          className="editor-board-zoom-wrapper"
          style={{ width: natural.width * renderScale, height: natural.height * renderScale }}
        >
          <div
            className="editor-board"
            style={{ transform: `scale(${renderScale})`, transformOrigin: "top left" }}
          >
            <Goban
              board={board}
              size={size}
              onPointClick={handleBoardClick}
              markers={correctPoints}
              viewRegion={effectiveRegion}
            />
          </div>
        </div>
      </div>

      <div className="problem-editor-toolbar" ref={toolbarRef}>
        <div className="toolbar-group">
          <label>
            판 크기:
            <select value={size} onChange={(e) => handleSizeChange(Number(e.target.value))}>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}줄
                </option>
              ))}
            </select>
          </label>
          <label>
            착수자:
            <select value={playerColor} onChange={(e) => setPlayerColor(e.target.value as StoneColor)}>
              <option value="black">흑</option>
              <option value="white">백</option>
            </select>
          </label>
        </div>

        <div className="toolbar-group">
          {(
            [
              ["black", "흑 놓기"],
              ["white", "백 놓기"],
              ["erase", "지우기"],
              ["answer", "정답 지정"],
              ["region", "코너 영역"],
            ] as [StoneMode, string][]
          ).map(([m, label]) => (
            <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
          {mode === "region" && pendingCorner && <span>반대쪽 꼭짓점을 클릭하세요</span>}
          {region && (
            <>
              <button onClick={() => setPreviewFullBoard((v) => !v)}>
                {previewFullBoard ? "잘린 영역 보기" : "전체판 보기"}
              </button>
              <button
                onClick={() => {
                  setRegion(null);
                  setPendingCorner(null);
                }}
              >
                영역 해제
              </button>
            </>
          )}
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
          <label>
            단원:
            <select
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                setLevelId(problemUnits.find((u) => u.id === e.target.value)?.levels[0]?.id ?? "");
              }}
            >
              {problemUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            레벨:
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
              {problemUnits
                .find((u) => u.id === unitId)
                ?.levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            순번:
            <input
              className="sequence-input"
              type="number"
              min={1}
              value={sequence}
              onChange={(e) => setSequence(Number(e.target.value))}
            />
          </label>
          <input
            className="title-input"
            type="text"
            placeholder="문제 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="toolbar-group">
          <button onClick={handleSave}>{editingId ? "수정 저장" : "새 문제 저장"}</button>
          {editingId && (
            <>
              <button onClick={() => handleDelete(editingId)}>이 문제 삭제</button>
              <button onClick={resetForm}>새 문제로</button>
            </>
          )}
          {message && <span className="editor-message">{message}</span>}
        </div>

        {loading ? (
          <div className="toolbar-group">불러오는 중...</div>
        ) : (
          levelProblems.length > 0 && (
            <div className="toolbar-group problem-list">
              {levelProblems.map((p) => (
                <span key={p.id} className={`problem-chip${p.id === editingId ? " active" : ""}`}>
                  {p.location.sequence}. {p.title}
                  <button onClick={() => loadForEdit(p)}>불러오기</button>
                  <button onClick={() => handleDelete(p.id)}>삭제</button>
                </span>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
