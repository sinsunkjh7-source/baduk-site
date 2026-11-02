/**
 * problems.js - 바둑 롤러코스터 3대 관문 사활/맥점 문제 데이터
 */
(function(window) {
  'use strict';

  const COASTER_PROBLEMS = [
    {
      id: 1,
      gateName: "제1관문: 낭떠러지 급강하 게이트",
      mission: "단수에 걸린 백돌을 따내고 롤러코스터 부스터를 점화하라!",
      hint: "백돌의 마지막 남은 활로(숨구멍) 1곳을 찾아 흑돌을 놓으세요.",
      gateActionName: "⚡ 90도 수직 낙하 & 최고속 질주!",
      boardSize: 5,
      stones: [
        // 백돌 (단수 상태)
        { x: 2, y: 2, color: 'w' },
        // 흑돌 포위망
        { x: 1, y: 2, color: 'b' },
        { x: 2, y: 1, color: 'b' },
        { x: 3, y: 2, color: 'b' },
        // 추가 장식 돌
        { x: 0, y: 1, color: 'b' },
        { x: 4, y: 1, color: 'b' }
      ],
      correct: { x: 2, y: 3 },
      explanation: "정답! 백돌의 마지막 활로 (2, 3)에 두어 백을 따내고 게이트를 열었습니다!"
    },
    {
      id: 2,
      gateName: "제2관문: 360도 루프 회전 게이트",
      mission: "흑 대마를 살리는 급소(두 집 만들기)를 찾아 루프를 돌파하라!",
      hint: "가운데 급소에 두어 한 집을 독립된 두 집으로 나누세요.",
      gateActionName: "🌀 360도 연속 롤러코스터 회전 루프!",
      boardSize: 5,
      stones: [
        // 흑돌 외곽 벽 (직사각형 3칸 궁도)
        { x: 1, y: 1, color: 'b' },
        { x: 2, y: 1, color: 'b' },
        { x: 3, y: 1, color: 'b' },
        { x: 1, y: 3, color: 'b' },
        { x: 2, y: 3, color: 'b' },
        { x: 3, y: 3, color: 'b' },
        { x: 0, y: 2, color: 'b' },
        { x: 4, y: 2, color: 'b' },
        // 백돌 외곽 포위
        { x: 0, y: 1, color: 'w' },
        { x: 4, y: 1, color: 'w' },
        { x: 0, y: 3, color: 'w' },
        { x: 4, y: 3, color: 'w' },
        { x: 2, y: 0, color: 'w' },
        { x: 2, y: 4, color: 'w' }
      ],
      // (1,2), (2,2), (3,2) 세 칸 중 가운데 (2,2)가 급소!
      correct: { x: 2, y: 2 },
      explanation: "정답! 3칸 궁도의 한가운데 (2, 2)에 두어 완벽한 두 집을 만들고 살아났습니다!"
    },
    {
      id: 3,
      gateName: "제3관문: 초고속 은하 워프 게이트",
      mission: "먹여치기 한 수로 백의 수를 줄여 최종 결승선으로 워프하라!",
      hint: "상대 집 속에 과감히 내 돌을 하나 희생(먹여치기)시켜 백을 단수로 만드세요.",
      gateActionName: "🚀 초공간 워프 가속 & 최종 승리 골인!",
      boardSize: 5,
      stones: [
        // 백돌 모양
        { x: 2, y: 1, color: 'w' },
        { x: 1, y: 2, color: 'w' },
        { x: 3, y: 2, color: 'w' },
        // 흑돌 포위망
        { x: 1, y: 1, color: 'b' },
        { x: 3, y: 1, color: 'b' },
        { x: 1, y: 3, color: 'b' },
        { x: 2, y: 3, color: 'b' },
        { x: 3, y: 3, color: 'b' }
      ],
      // (2, 2) 호구 속으로 먹여치기!
      correct: { x: 2, y: 2 },
      explanation: "정답! (2, 2) 먹여치기로 백돌을 뭉치게 하여 단수로 몰아 게이트를 통과했습니다!"
    }
  ];

  window.COASTER_PROBLEMS = COASTER_PROBLEMS;
})(window);
