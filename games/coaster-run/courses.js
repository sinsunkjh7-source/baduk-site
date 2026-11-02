/**
 * courses.js - 100% 순수 3D WebGL 롤러코스터 바둑 코스 설정
 * 
 * 1코스: ❄️ 프로즌 글래시어 런 (만년설 빙하 & 155m 설산 수직 다이브 3D)
 * 2코스: 🔥 마그마 화산 런 (용암 바다 & 155m 분화구 정점 수직 다이브 3D)
 * 3코스: 🌌 은하계 심우주 런 (암흑 우주 & 토성 고리 워프 질주 3D)
 */
(function(window) {
  'use strict';

  window.COASTER_COURSES = {
    // ❄️ 1코스: 프로즌 글래시어 런 (3D 신규 빙하/설산 테마)
    glacier: {
      id: 'glacier',
      engineType: 'glacier',
      title: '❄️ 제1코스: 프로즌 글래시어 런',
      theme: '만년설 빙하 & 155m 설산 수직 다이브 (3D)',
      gates: [
        {
          id: 0,
          t: 0.115,
          time: 20.0,
          solved: false,
          gateName: '제1관문: 155m 설산 정상 칼날 능선! 백돌 따내기',
          mission: '빙하 절벽 아래로 낙하하기 직전! 마지막 숨구멍을 찔러 143m 수직 다이브를 점화하라!',
          hint: '백돌의 남은 활로(오른쪽 빈칸)를 클릭하세요.',
          gateActionName: '❄️ 143m 수직 90도 빙벽 다이브 & 240km/h 초고속 낙하!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' },
            { x: 2, y: 3, color: 'b' }
          ],
          correct: { x: 3, y: 2 }
        },
        {
          id: 1,
          t: 0.370,
          time: 42.0,
          solved: false,
          gateName: '제2관문: 115m 빙산 카멜백 언덕 정점 백돌 따내기',
          mission: '빙판 언덕을 넘어 크레바스 계곡을 횡단하라!',
          hint: '위쪽 마지막 활로를 클릭하세요.',
          gateActionName: '🌀 솟구치는 에어타임 무중력 부양 & 빙하 횡단!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' },
            { x: 1, y: 1, color: 'b' },
            { x: 3, y: 1, color: 'b' },
            { x: 2, y: 2, color: 'b' }
          ],
          correct: { x: 2, y: 0 }
        },
        {
          id: 2,
          t: 0.540,
          time: 65.0,
          solved: false,
          gateName: '제3관문: 푸른 얼음 동굴 S자 뱅킹 진입로 백돌 따내기',
          mission: '얼음 동굴 입구에 갇힌 백돌을 따내고 급격한 빙판 곡선을 돌파하라!',
          hint: '귀의 백돌 바로 옆 활로를 클릭하세요.',
          gateActionName: '⚡ 45도 급격한 S자 얼음 뱅킹 트위스트 질주!',
          boardSize: 5,
          stones: [
            { x: 0, y: 4, color: 'w' },
            { x: 1, y: 4, color: 'b' }
          ],
          correct: { x: 0, y: 3 }
        },
        {
          id: 3,
          t: 0.700,
          time: 86.0,
          solved: false,
          gateName: '제4관문: 125m 고드름 타워 솟구침 직전! 백 2점 따내기',
          mission: '상당한 오르막 빙벽을 치솟기 직전, 뭉친 백 2점을 한 방에 따내라!',
          hint: '아래쪽 남은 활로 1곳을 클릭하세요.',
          gateActionName: '🧊 125m 고드름 타워 수직 로켓 솟구침 & 고공 선회!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' }, { x: 2, y: 3, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 1, y: 3, color: 'b' },
            { x: 3, y: 2, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 2, y: 1, color: 'b' }
          ],
          correct: { x: 2, y: 4 }
        },
        {
          id: 4,
          t: 0.855,
          time: 108.0,
          solved: false,
          gateName: '제5관문: 블리자드 대탈출 최종 백돌 따내기',
          mission: '마지막 단수 백돌을 따내고 눈보라 휘몰아치는 설산을 탈출하라!',
          hint: '백돌의 마지막 숨구멍을 클릭하세요.',
          gateActionName: '🚀 360도 나선 급강하 헬릭스 & 대성공 골인!',
          boardSize: 5,
          stones: [
            { x: 3, y: 3, color: 'w' },
            { x: 2, y: 3, color: 'b' },
            { x: 4, y: 3, color: 'b' },
            { x: 3, y: 4, color: 'b' }
          ],
          correct: { x: 3, y: 2 }
        }
      ]
    },

    // 🔥 2코스: 마그마 화산 런 (3D 용암 테마)
    magma: {
      id: 'magma',
      engineType: 'magma',
      title: '🔥 제2코스: 마그마 화산 런',
      theme: '용암 바다 & 155m 분화구 정점 수직 다이브 (3D)',
      gates: [
        {
          id: 0,
          t: 0.115,
          time: 20.0,
          solved: false,
          gateName: '제1관문: 155m 정상 정점! 천길 낭떠러지 백돌 따내기',
          mission: '아래가 안 보이는 절벽 앞! 마지막 숨구멍을 찔러 143m 수직 다이브를 점화하라!',
          hint: '백돌의 남은 활로(오른쪽 빈칸)를 클릭하세요.',
          gateActionName: '💥 143m 수직 90도 절벽 다이브 & 240km/h 초고속 낙하!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' },
            { x: 2, y: 3, color: 'b' }
          ],
          correct: { x: 3, y: 2 }
        },
        {
          id: 1,
          t: 0.370,
          time: 42.0,
          solved: false,
          gateName: '제2관문: 115m 에어타임 언덕 정점 직전 백돌 따내기',
          mission: '도망치려는 백돌을 막고 언덕을 넘어 용암 호수를 횡단하라!',
          hint: '위쪽 마지막 활로를 클릭하세요.',
          gateActionName: '🌀 솟구치는 에어타임 무중력 부양 & 용암 호수 횡단!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' },
            { x: 1, y: 1, color: 'b' },
            { x: 3, y: 1, color: 'b' },
            { x: 2, y: 2, color: 'b' }
          ],
          correct: { x: 2, y: 0 }
        },
        {
          id: 2,
          t: 0.540,
          time: 65.0,
          solved: false,
          gateName: '제3관문: 흑요석 동굴 S자 뱅킹 진입로 백돌 따내기',
          mission: '구석에 갇혀 활로가 1개뿐인 백돌을 따내고 급격한 곡선 턴을 돌파하라!',
          hint: '귀의 백돌 바로 옆 활로를 클릭하세요.',
          gateActionName: '⚡ 45도 급격한 S자 뱅킹 트위스트 질주!',
          boardSize: 5,
          stones: [
            { x: 0, y: 4, color: 'w' },
            { x: 1, y: 4, color: 'b' }
          ],
          correct: { x: 0, y: 3 }
        },
        {
          id: 3,
          t: 0.700,
          time: 86.0,
          solved: false,
          gateName: '제4관문: 125m 간헐천 수직 솟구침 직전! 백 2점 따내기',
          mission: '상당한 오르막을 치솟기 직전, 뭉친 백 2점을 한 방에 따내라!',
          hint: '아래쪽 남은 활로 1곳을 클릭하세요.',
          gateActionName: '🌋 125m 간헐천 수직 로켓 솟구침 & 고공 선회!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' }, { x: 2, y: 3, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 1, y: 3, color: 'b' },
            { x: 3, y: 2, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 2, y: 1, color: 'b' }
          ],
          correct: { x: 2, y: 4 }
        },
        {
          id: 4,
          t: 0.855,
          time: 108.0,
          solved: false,
          gateName: '제5관문: 화산 대폭발 최종 360도 나선 급강하 따내기',
          mission: '마지막 단수 백돌을 따내고 화산 외벽을 타고 240km/h로 탈출하라!',
          hint: '백돌의 마지막 숨구멍을 클릭하세요.',
          gateActionName: '🚀 360도 나선 급강하 헬릭스 & 대성공 골인!',
          boardSize: 5,
          stones: [
            { x: 3, y: 3, color: 'w' },
            { x: 2, y: 3, color: 'b' },
            { x: 4, y: 3, color: 'b' },
            { x: 3, y: 4, color: 'b' }
          ],
          correct: { x: 3, y: 2 }
        }
      ]
    },

    // 🌌 3코스: 은하계 심우주 런 (3D 우주 테마)
    space: {
      id: 'space',
      engineType: 'space',
      title: '🌌 제3코스: 은하계 심우주 런',
      theme: '칠흑 암흑 우주 & 토성 고리 워프 질주 (3D)',
      gates: [
        {
          id: 0,
          t: 0.22,
          time: 25.0,
          solved: false,
          gateName: '제1관문: 성운 입구 백돌 따내기',
          mission: '성운 진입로를 가로막는 백돌을 따내 워프 부스터를 점화하라!',
          hint: '백돌의 마지막 숨구멍(위쪽)을 클릭하세요.',
          gateActionName: '🌌 성운 웜홀 초광속 워프 점화!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' },
            { x: 3, y: 2, color: 'b' },
            { x: 2, y: 3, color: 'b' }
          ],
          correct: { x: 2, y: 1 }
        },
        {
          id: 1,
          t: 0.52,
          time: 55.0,
          solved: false,
          gateName: '제2관문: 토성 고리 외곽 백돌 따내기',
          mission: '얼음 파편을 뚫고 궤도에 갇힌 백돌을 신속히 따내라!',
          hint: '오른쪽 빈자리 활로를 클릭하세요.',
          gateActionName: '🪐 토성 고리 초저공 뱅킹 질주!',
          boardSize: 5,
          stones: [
            { x: 1, y: 2, color: 'w' },
            { x: 0, y: 2, color: 'b' },
            { x: 1, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          t: 0.82,
          time: 85.0,
          solved: false,
          gateName: '제3관문: 블랙홀 탈출 최종 백 2점 따내기',
          mission: '중력장에 빨려 들어가는 뭉친 백 2점을 한 방에 따내고 탈출하라!',
          hint: '백 2점의 마지막 공통 숨구멍을 찌르세요.',
          gateActionName: '⚡ 초광속 하이퍼드라이브 최종 탈출!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 2, y: 3, color: 'b' }
          ],
          correct: { x: 3, y: 3 }
        }
      ]
    }
  };
})(window);
