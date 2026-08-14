import { useEffect, useRef, useState } from "react";
import { ProblemBoard } from "./ProblemBoard";
import { formatProblemCode } from "./problemCode";
import type { Problem } from "./types";
import "./ProblemSetPlayer.css";

const ADVANCE_DELAY_MS = 1000;

export function ProblemSetPlayer({ problems }: { problems: Problem[] }) {
  const [index, setIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  function goTo(i: number) {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setIndex(Math.max(0, Math.min(problems.length - 1, i)));
  }

  function handleSolved() {
    const problem = problems[index];
    setSolvedIds((prev) => {
      const next = new Set(prev);
      next.add(problem.id);
      return next;
    });
    if (index < problems.length - 1) {
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setIndex((i) => Math.min(problems.length - 1, i + 1));
      }, ADVANCE_DELAY_MS);
    }
  }

  const problem = problems[index];
  if (!problem) return null;

  return (
    <div className="problem-set-player">
      <div className="problem-set-main">
        <div className="problem-set-nav">
          <button onClick={() => goTo(index - 1)} disabled={index === 0}>
            ◀ 이전 문제
          </button>
          <span>
            {index + 1} / {problems.length}
          </span>
          <button onClick={() => goTo(index + 1)} disabled={index === problems.length - 1}>
            다음 문제 ▶
          </button>
        </div>

        <ProblemBoard
          key={problem.id}
          problem={problem}
          code={formatProblemCode(problem)}
          onSolved={handleSolved}
        />
      </div>

      <div className="problem-set-sidebar">
        <div className="problem-set-sidebar-title">문제 목록</div>
        <div className="problem-number-grid">
          {problems.map((p, i) => {
            const solved = solvedIds.has(p.id);
            const current = i === index;
            return (
              <button
                key={p.id}
                className={`problem-number${current ? " current" : ""}${solved ? " solved" : ""}`}
                onClick={() => goTo(i)}
                title={p.title}
              >
                {solved ? "✓" : i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
