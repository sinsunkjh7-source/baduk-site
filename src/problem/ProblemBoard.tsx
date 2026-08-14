import { useEffect, useMemo, useRef, useState } from "react";
import { Goban } from "../goban/Goban";
import { createEmptyBoard, placeStone } from "../goban/boardLogic";
import type { Board, Point } from "../goban/types";
import type { Problem } from "./types";
import { playCorrectSound, playIncorrectSound } from "./sound";
import "./ProblemBoard.css";

type Status = "idle" | "correct" | "incorrect";

function buildInitialBoard(problem: Problem): Board {
  const board = createEmptyBoard(problem.size);
  for (const stone of problem.initialStones) {
    board[stone.y][stone.x] = stone.color;
  }
  return board;
}

const INCORRECT_RESET_DELAY_MS = 900;

export function ProblemBoard({ problem, code }: { problem: Problem; code?: string }) {
  const initialBoard = useMemo(() => buildInitialBoard(problem), [problem]);
  const [board, setBoard] = useState(initialBoard);
  const [status, setStatus] = useState<Status>("idle");
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
    setStatus("idle");
    setLastMove(null);
    setShowAnswer(false);
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, [initialBoard]);

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

  const statusText =
    status === "correct"
      ? "정답입니다!"
      : status === "incorrect"
        ? "오답입니다. 다시 시도해보세요."
        : `${problem.playerColor === "black" ? "흑" : "백"} 차례 — 놓아보세요`;

  return (
    <div className="problem-board">
      {code && <div className="problem-code">{code}</div>}
      <h3>{problem.title}</h3>
      <Goban
        board={board}
        size={problem.size}
        lastMove={lastMove}
        onPointClick={handlePointClick}
        markers={showAnswer ? problem.correctPoints : undefined}
      />
      <div className={`problem-status status-${status}`}>{statusText}</div>
      <button onClick={() => setShowAnswer((v) => !v)}>
        {showAnswer ? "정답 숨기기" : "정답 보기"}
      </button>
    </div>
  );
}
