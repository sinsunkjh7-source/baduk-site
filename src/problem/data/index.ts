import type { Problem } from "../types";
import { ttaenaegiProblems } from "./ttaenaegi";

// 새 단원 문제 파일을 만들면 여기서 import해서 아래 배열에 추가한다.
export const allProblems: Problem[] = [...ttaenaegiProblems];

export function getProblemsByUnit(unitId: string): Problem[] {
  return allProblems
    .filter((p) => p.location.unitId === unitId)
    .sort(
      (a, b) =>
        a.location.levelId.localeCompare(b.location.levelId) ||
        a.location.sequence - b.location.sequence
    );
}

export function getProblemById(id: string): Problem | undefined {
  return allProblems.find((p) => p.id === id);
}

export function getProblemsByLevel(unitId: string, levelId: string): Problem[] {
  return getProblemsByUnit(unitId).filter((p) => p.location.levelId === levelId);
}
