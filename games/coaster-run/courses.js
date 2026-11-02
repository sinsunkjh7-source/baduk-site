/**
 * courses.js - 롤러코스터 테마 코스별 영상 & 관문 데이터 세트
 */
(function(window) {
  'use strict';

  const COASTER_COURSES = {
    mako: {
      id: 'mako',
      title: '🌊 제1코스: 에메랄드 호수 런',
      theme: '호수 & 테마파크 전경 (B&M 하이퍼코스터)',
      videoSrc: 'assets/coaster_real_mako.mp4',
      webmSrc: 'assets/coaster_real_mako_480p.webm',
      gates: [
        {
          id: 0,
          time: 36.2,
          solved: false,
          gateName: '제1관문: 61m 정상 호수 급강하',
          mission: '단수에 걸린 백돌을 따내고 140km/h 부스터를 점화하라!',
          hint: '백돌의 마지막 남은 활로(숨구멍) 1곳을 찾아 클릭하세요.',
          gateActionName: '⚡ 73도 수직 낙하 & 최고속 질주!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' },
            { x: 3, y: 2, color: 'b' },
            { x: 0, y: 1, color: 'b' },
            { x: 4, y: 1, color: 'b' }
          ],
          correct: { x: 2, y: 3 }
        },
        {
          id: 1,
          time: 56.4,
          solved: false,
          gateName: '제2관문: 에어타임 언덕 정상',
          mission: '흑 대마를 살리는 급소(두 집 만들기)를 찾아 언덕을 돌파하라!',
          hint: '가운데 급소에 두어 한 집을 독립된 두 집으로 나누세요.',
          gateActionName: '🌀 솟구치는 에어타임 & 호수 질주!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 0, y: 1, color: 'w' }, { x: 4, y: 1, color: 'w' },
            { x: 0, y: 3, color: 'w' }, { x: 4, y: 3, color: 'w' },
            { x: 2, y: 0, color: 'w' }, { x: 2, y: 4, color: 'w' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          time: 78.5,
          solved: false,
          gateName: '제3관문: 수면 스피드 뱅킹 턴',
          mission: '먹여치기 한 수로 백의 수를 줄여 결승선으로 질주하라!',
          hint: '상대 집 속에 과감히 내 돌을 하나 희생(먹여치기)시켜 백을 단수로 만드세요.',
          gateActionName: '🚀 수면 초고속 선회 & 최종 골인!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' }, { x: 1, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 1, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 2, y: 0, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        }
      ]
    },
    fury: {
      id: 'fury',
      title: '⚡ 제2코스: 99m 스카이 기가 런',
      theme: '세계 1위 기가코스터 (구름 위 초고층 & 브릿지 터널)',
      videoSrc: 'assets/coaster_fury_325.mp4',
      webmSrc: 'assets/coaster_fury_325_480p.webm',
      gates: [
        {
          id: 0,
          time: 31.8, // 퓨리 325 99m 구름 위 정상 정점!
          solved: false,
          gateName: '제1관문: 99m 구름 위 급강하 게이트',
          mission: '단수에 걸린 백 2점을 따내고 153km/h 수직 질주를 시작하라!',
          hint: '백돌의 마지막 활로 1곳을 찾아 클릭하세요.',
          gateActionName: '⚡ 81도 수직 절벽 낙하 & 153km/h 폭풍 질주!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' }
          ],
          correct: { x: 4, y: 2 }
        },
        {
          id: 1,
          time: 51.5, // 브릿지 하부 지하 터널 진입 전 고속 언덕
          solved: false,
          gateName: '제2관문: 하이웨이 브릿지 터널 진입',
          mission: '두 집을 나누는 급소에 착수하여 지하 터널을 관통하라!',
          hint: '중앙 급소를 찾아 완벽한 두 집을 완성하세요.',
          gateActionName: '🌀 다리 밑 지하 터널 통과 & 고속 S자 커브!',
          boardSize: 5,
          stones: [
            { x: 1, y: 2, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 2, color: 'b' }, { x: 2, y: 3, color: 'b' },
            { x: 0, y: 2, color: 'w' }, { x: 4, y: 2, color: 'w' }, { x: 2, y: 0, color: 'w' }, { x: 2, y: 4, color: 'w' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          time: 72.0, // 결승 전 고속 360도 나선 헬릭스
          solved: false,
          gateName: '제3관문: 파이널 고공 나선 헬릭스',
          mission: '먹여치기 한 수로 백 대마를 몰살시키고 최종 골인하라!',
          hint: '상대의 호구 속에 과감히 내 돌을 하나 집어넣으세요.',
          gateActionName: '🚀 360도 고공 나선 회전 & 최종 완주 성공!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'w' }, { x: 2, y: 1, color: 'w' }, { x: 3, y: 1, color: 'w' },
            { x: 1, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 0, y: 1, color: 'b' }, { x: 4, y: 1, color: 'b' }, { x: 1, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        }
      ]
    }
  };

  window.COASTER_COURSES = COASTER_COURSES;
})(window);