import type { Level, Unit } from "./types";

/** Doc 기준 표준 3단계(기본/심화/고난도) 구조. 단원별로 필요하면 커스텀 레벨 배열을 따로 정의해도 된다. */
function standardLevels(): Level[] {
  return [
    { id: "1-1", label: "기본 개념", kind: "video" },
    { id: "1-2", label: "기본 문제", kind: "problem" },
    { id: "2-1", label: "심화 개념", kind: "video" },
    { id: "2-2", label: "심화 문제", kind: "problem" },
    { id: "3-1", label: "고난도 개념", kind: "video" },
    { id: "3-2", label: "고난도 문제", kind: "problem" },
  ];
}

/** 새 단원을 추가하려면 이 배열에 항목을 더하면 된다. */
export const units: Unit[] = [
  { id: "chuk", name: "축", levels: standardLevels() },
  { id: "ttaenaegi", name: "따내기", levels: standardLevels() },
];

export function getUnit(unitId: string): Unit | undefined {
  return units.find((u) => u.id === unitId);
}

export function getLevel(unitId: string, levelId: string): Level | undefined {
  return getUnit(unitId)?.levels.find((l) => l.id === levelId);
}
