import { useState } from "react";
import { Goban } from "./goban/Goban";
import { useGoban } from "./goban/useGoban";
import type { PlacementMode, StoneColor } from "./goban/types";

const BOARD_SIZES = [9, 13, 19];

const MODE_LABELS: Record<PlacementMode, string> = {
  fixedBlack: "흑 고정",
  fixedWhite: "백 고정",
  alternating: "교차 착수",
  free: "자유 선택",
};

export function CoreEngineDemo() {
  const goban = useGoban(19);
  const [freeColor, setFreeColor] = useState<StoneColor>("black");

  const handlePointClick = (p: { x: number; y: number }) => {
    if (goban.mode === "free") {
      goban.place(p, freeColor);
    } else {
      goban.place(p);
    }
  };

  return (
    <div className="app">
      <div className="controls">
        <label>
          판 크기:
          <select value={goban.size} onChange={(e) => goban.reset(Number(e.target.value))}>
            {BOARD_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} x {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          착수 방식:
          <select value={goban.mode} onChange={(e) => goban.setMode(e.target.value as PlacementMode)}>
            {Object.entries(MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {goban.mode === "free" && (
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
            checked={goban.enforceRules}
            onChange={(e) => goban.setEnforceRules(e.target.checked)}
          />
          규칙 검증 (자충수 금지)
        </label>

        <button onClick={goban.undo} disabled={goban.moveIndex === 0}>
          ◀ 되돌리기
        </button>
        <button onClick={goban.redo} disabled={goban.moveIndex === goban.moveCount}>
          다시 실행 ▶
        </button>
        <button onClick={() => goban.reset()}>초기화</button>

        <span className="move-count">
          수: {goban.moveIndex} / {goban.moveCount}
        </span>
      </div>

      <Goban board={goban.board} size={goban.size} lastMove={goban.lastMove} onPointClick={handlePointClick} />
    </div>
  );
}
