import type { Problem } from "../types";

export function getProblemsByUnit(problems: Problem[], unitId: string): Problem[] {
  return problems
    .filter((p) => p.location.unitId === unitId)
    .sort(
      (a, b) =>
        a.location.levelId.localeCompare(b.location.levelId) ||
        a.location.sequence - b.location.sequence
    );
}

export function getProblemById(problems: Problem[], id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}

export function getProblemsByLevel(problems: Problem[], unitId: string, levelId: string): Problem[] {
  return getProblemsByUnit(problems, unitId).filter((p) => p.location.levelId === levelId);
}
