import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Goban } from "../goban/Goban";
import { createEmptyBoard } from "../goban/boardLogic";
import type { BoardRegion, Board, Point, StoneColor } from "../goban/types";
import type { InitialStone, Problem } from "./types";
import { units } from "../curriculum/units";
import { useProblems } from "./store";
import { saveNewProblem, saveExistingProblem, removeProblem } from "./store";
import { getProblemsByLevel } from "./data";
import "./ProblemEditor.css";

type StoneMode = "black" | "white" | "erase" | "answer" | "region";

const SIZES = [9, 13, 19] as const;
const MIN_FIT_PX = 200;
const ZOOM_MIN_PERCENT = 30;
const ZOOM_MAX_PERCENT = 300;
const ZOOM_STEP_PERCENT = 20;

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
  const [fitSizePx, setFitSizePx] = useState(400);
  const [zoomPercent, setZoomPercent] = useState(100);
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Suggest the next free sequence number whenever unit/level changes for a *new* problem.
  useEffect(() => {
    if (editingId) return;
    setSequence(nextSequence(problems, unitId, levelId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, levelId, problems, editingId]);

  const effectiveRegion = region && !previewFullBoard ? region : undefined;

  // Rather than hand-computing the board's exact pixel width/height in JS (fragile — easy to
  // get subtly wrong and end up clipped), we only measure the one genuinely dynamic quantity
  // — how much space is actually left after the toolbar — as a single side length for a
  // square box. The box is always the same for every board size (9/13/19 all get the same
  // outer footprint, matching the last "19줄 잘리지 않게" request), and CSS + the SVG's own
  // viewBox scaling (width/height: 100% on the <svg>, see ProblemEditor.css) fill that box
  // correctly and can never overflow it — that's guaranteed by how SVG scaling works, not by
  // arithmetic we have to get exactly right.
  useLayoutEffect(() => {
    const SAFETY_MARGIN = 16;

    function computeFitPx(): number {
      const rootEl = rootRef.current;
      const toolbarEl = toolbarRef.current;

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

      return Math.max(MIN_FIT_PX, Math.min(availableWidth, availableHeight));
    }

    function apply() {
      setFitSizePx(computeFitPx());
    }

    apply();
    window.addEventListener("resize", apply);
    const observer = new ResizeObserver(apply);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    return () => {
      window.removeEventListener("resize", apply);
      observer.disconnect();
    };
    // Deliberately NOT keyed on size/region — every size shares the same fit box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems.length, loading]);

  const sizePx = (fitSizePx * zoomPercent) / 100;

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
        <div className="editor-board-zoom-wrapper" style={{ width: sizePx, height: sizePx }}>
          <Goban
            board={board}
            size={size}
            onPointClick={handleBoardClick}
            markers={correctPoints}
            viewRegion={effectiveRegion}
          />
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
            onClick={() => setZoomPercent((z) => Math.max(ZOOM_MIN_PERCENT, z - ZOOM_STEP_PERCENT))}
          >
            －
          </button>
          <span className="zoom-level">{zoomPercent}%</span>
          <button
            onClick={() => setZoomPercent((z) => Math.min(ZOOM_MAX_PERCENT, z + ZOOM_STEP_PERCENT))}
          >
            ＋
          </button>
          <button onClick={() => setZoomPercent(100)}>화면 맞춤</button>
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
