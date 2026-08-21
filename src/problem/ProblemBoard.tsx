import { useEffect, useMemo, useRef, useState } from "react";
import { Goban } from "../goban/Goban";
import { createEmptyBoard, placeStone } from "../goban/boardLogic";
import { useGoban } from "../goban/useGoban";
import { useFitSquareBox } from "../goban/useFitSquareBox";
import type { Board, Point } from "../goban/types";
import type { Problem } from "./types";
import { playCorrectSound, playIncorrectSound } from "../sound/soundSettings";
import "./ProblemBoard.css";

type Status = "idle" | "correct" | "incorrect";
type Mode = "check" | "free";

const MIN_FIT_PX = 200;

function buildInitialBoard(problem: Problem): Board {
  const board = createEmptyBoard(problem.size);
  for (const stone of problem.initialStones) {
    board[stone.y][stone.x] = stone.color;
  }
  return board;
}

const INCORRECT_RESET_DELAY_MS = 900;

interface ProblemBoardProps {
  problem: Problem;
  code?: string;
  onSolved?: () => void;
}

export function ProblemBoard({ problem, code, onSolved }: ProblemBoardProps) {
  const initialBoard = useMemo(() => buildInitialBoard(problem), [problem]);
  const [mode, setMode] = useState<Mode>("check");
  const [board, setBoard] = useState(initialBoard);
  const [status, setStatus] = useState<Status>("idle");
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const aboveRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);

  // Free-play exploration: lets a student actually play out the position — see captures
  // happen, try a wrong-looking move and see why it fails — instead of only getting an
  // instant correct/incorrect verdict on a single click. Kept as separate board state so
  // switching modes never disturbs the "check the answer" flow.
  const freePlay = useGoban(problem.size, initialBoard);

  // Same fit-box approach as the problem editor, so a problem is played back at the same
  // on-screen board size it was created at, regardless of 9/13/19 selection.
  const sizePx = useFitSquareBox({
    containerRef: rootRef,
    aboveRef,
    belowRef,
    minPx: MIN_FIT_PX,
    deps: [problem.id, mode, status, showAnswer],
  });

  useEffect(() => {
    setMode("check");
    setBoard(initialBoard);
    setStatus("idle");
    setLastMove(null);
    setShowAnswer(false);
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, [initialBoard]);

  useEffect(() => {
    if (status === "correct") onSolved?.();
    // onSolved intentionally excluded: status only reaches "correct" once per problem instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handlePointClick(p: Point) {
    if (status !== "idle" || board[p.y][p.x] !== null) return;

    const result = placeStone(board, p, problem.playerColor, false);
    if (!result.legal) return;

    const isCorrect = problem.correctPoints.some((cp) => cp.x === p.x && cp.y === p.y);
    setBoard(result.board);
    setLastMove(p);

    if (isCorrect) {
      setStatus("correct");
      playCorrectSound();
    } else {
      setStatus("incorrect");
      playIncorrectSound();
      resetTimer.current = window.setTimeout(() => {
        setBoard(initialBoard);
        setLastMove(null);
        setStatus("idle");
      }, INCORRECT_RESET_DELAY_MS);
    }
  }

  function handleFreePlayClick(p: Point) {
    const startingColor = freePlay.moveIndex === 0 ? problem.playerColor : undefined;
    freePlay.place(p, startingColor);
  }

  const statusText =
    status === "correct"
      ? "정답입니다!"
      : status === "incorrect"
        ? "오답입니다. 다시 시도해보세요."
        : `${problem.playerColor === "black" ? "흑" : "백"} 차례 — 놓아보세요`;

  return (
    <div className="problem-board" ref={rootRef}>
      <div className="problem-board-above" ref={aboveRef}>
        {code && <div className="problem-code">{code}</div>}
        <h3>{problem.title}</h3>

        <div className="problem-mode-toggle">
          <button className={mode === "check" ? "active" : ""} onClick={() => setMode("check")}>
            정답 맞히기
          </button>
          <button className={mode === "free" ? "active" : ""} onClick={() => setMode("free")}>
            자유롭게 놓아보기
          </button>
        </div>
      </div>

      <div className="board-fit-wrapper" style={{ width: sizePx, height: sizePx }}>
        {mode === "check" ? (
          <Goban
            board={board}
            size={problem.size}
            lastMove={lastMove}
            onPointClick={handlePointClick}
            markers={showAnswer ? problem.correctPoints : undefined}
            viewRegion={problem.region}
          />
        ) : (
          <Goban
            board={freePlay.board}
            size={problem.size}
            lastMove={freePlay.lastMove}
            onPointClick={handleFreePlayClick}
            markers={showAnswer ? problem.correctPoints : undefined}
            viewRegion={problem.region}
          />
        )}
      </div>

      <div className="problem-board-below" ref={belowRef}>
        {mode === "check" ? (
          <div className={`problem-status status-${status}`}>{statusText}</div>
        ) : (
          <div className="free-play-controls">
            <button onClick={() => freePlay.reset(problem.size, initialBoard)}>처음으로</button>
            <button onClick={freePlay.undo} disabled={freePlay.moveIndex === 0}>
              ◀ 되돌리기
            </button>
            <button onClick={freePlay.redo} disabled={freePlay.moveIndex === freePlay.moveCount}>
              다시 실행 ▶
            </button>
            <span className="move-count">
              수: {freePlay.moveIndex}/{freePlay.moveCount}
            </span>
          </div>
        )}
        <button onClick={() => setShowAnswer((v) => !v)}>{showAnswer ? "정답 숨기기" : "정답 보기"}</button>
      </div>
    </div>
  );
}
