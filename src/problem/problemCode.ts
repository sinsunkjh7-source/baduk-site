import { getUnit } from "../curriculum/units";
import type { Problem } from "./types";

/** 예: 축 단원, 레벨 2-1, 5번 문제 -> "축 2-1-05" */
export function formatProblemCode(problem: Problem): string {
  const unitName = getUnit(problem.location.unitId)?.name ?? problem.location.unitId;
  const seq = String(problem.location.sequence).padStart(2, "0");
  return `${unitName} ${problem.location.levelId}-${seq}`;
}
