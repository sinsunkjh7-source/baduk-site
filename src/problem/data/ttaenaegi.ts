import type { Problem } from "../types";

/** "따내기" 단원 문제 모음. 새 문제는 이 배열에 추가하고, 지울 때는 항목만 제거하면 된다. */
export const ttaenaegiProblems: Problem[] = [
  {
    id: "ttaenaegi-1-2-01",
    location: { unitId: "ttaenaegi", levelId: "1-2", sequence: 1 },
    title: "흑돌을 따내보세요 (백 차례)",
    size: 9,
    initialStones: [
      { x: 4, y: 4, color: "black" },
      { x: 3, y: 4, color: "white" },
      { x: 5, y: 4, color: "white" },
      { x: 4, y: 3, color: "white" },
    ],
    playerColor: "white",
    correctPoints: [{ x: 4, y: 5 }],
  },
  {
    id: "ttaenaegi-1-2-02",
    location: { unitId: "ttaenaegi", levelId: "1-2", sequence: 2 },
    title: "단수된 돌 중 하나를 따내보세요 (백 차례, 정답 두 곳)",
    size: 9,
    initialStones: [
      // 왼쪽 위 흑돌 단수
      { x: 2, y: 2, color: "black" },
      { x: 1, y: 2, color: "white" },
      { x: 3, y: 2, color: "white" },
      { x: 2, y: 1, color: "white" },
      // 오른쪽 아래 흑돌 단수
      { x: 6, y: 6, color: "black" },
      { x: 5, y: 6, color: "white" },
      { x: 7, y: 6, color: "white" },
      { x: 6, y: 5, color: "white" },
    ],
    playerColor: "white",
    correctPoints: [
      { x: 2, y: 3 },
      { x: 6, y: 7 },
    ],
  },
];
