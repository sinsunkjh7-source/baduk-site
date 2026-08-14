import type { Point, StoneColor } from "../goban/types";

export interface InitialStone extends Point {
  color: StoneColor;
}

export interface ProblemLocation {
  unitId: string;
  /** e.g. "2-1" — must match a Level.id defined in curriculum/units.ts */
  levelId: string;
  /** 단원+레벨 안에서의 문제 순번 (1부터) */
  sequence: number;
}

export interface Problem {
  /** 안정적인 고유 id. 보통 `${unitId}-${levelId}-${sequence}` 형태를 권장. */
  id: string;
  location: ProblemLocation;
  title: string;
  size: number;
  initialStones: InitialStone[];
  playerColor: StoneColor;
  /** 이 중 어느 좌표에 두어도 정답으로 인정된다 (동형 정답 지원). */
  correctPoints: Point[];
}
