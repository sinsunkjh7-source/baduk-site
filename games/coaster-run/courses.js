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
    },
    space: {
      id: 'space',
      engineType: 'space',
      title: '🌌 제3코스: 은하계 심우주 런',
      theme: '칠흑 같은 우주 & 토성의 고리와 성운 (CGI 3D 네온 트론)',
      gates: [
        {
          id: 0,
          t: 0.22,
          time: 25.0,
          solved: false,
          gateName: '제1관문: 토성의 고리 웜홀 스타게이트',
          mission: '단수에 걸린 백돌을 따내고 워프 드라이브를 가동하라!',
          hint: '백돌의 마지막 숨구멍 1곳을 찾아 클릭하세요.',
          gateActionName: '⚡ 워프 드라이브 점화 & 토성 고리 초광속 돌파!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 2, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' }
          ],
          correct: { x: 2, y: 3 }
        },
        {
          id: 1,
          t: 0.52,
          time: 48.0,
          solved: false,
          gateName: '제2관문: 오리온 성운 코스믹 게이트',
          mission: '흑 대마를 살리는 독립된 두 집을 만들고 성운을 관통하라!',
          hint: '가운데 급소에 착수하여 두 집을 완성하세요.',
          gateActionName: '🌀 플라즈마 부스터 200km/h & 성운 심연 관통!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 2, y: 0, color: 'w' }, { x: 2, y: 4, color: 'w' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          t: 0.82,
          time: 75.0,
          solved: false,
          gateName: '제3관문: 블랙홀 탈출 초광속 관문',
          mission: '먹여치기 한 수로 블랙홀 중력권을 탈출하여 은하계로 귀환하라!',
          hint: '상대 진영 속에 내 돌을 하나 희생(먹여치기)시켜 백을 단수로 만드세요.',
          gateActionName: '🚀 광속 돌파 & 은하계 대탈출 성공!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' }, { x: 1, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 1, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' }, { x: 2, y: 0, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        }
      ]
    },
    
    magma: {
      id: 'magma',
      engineType: 'magma',
      title: '🔥 제5코스: 마그마 화산 런',
      theme: '용암 바다 & 솟구치는 불꽃 파티클 (3D 엔진 다이내믹 런)',
      gates: [
        {
          id: 0,
          t: 0.16,
          time: 20.0,
          solved: false,
          gateName: '제1관문: 분화구 정상 백돌 따내기',
          mission: '단수에 걸린 백돌의 마지막 숨구멍을 찔러 따내라!',
          hint: '백돌의 남은 활로(오른쪽 빈칸)를 클릭하세요.',
          gateActionName: '🔥 마그마 부스터 180km/h & 95m 용암 수직 다이브!',
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
          t: 0.35,
          time: 42.0,
          solved: false,
          gateName: '제2관문: 용암 호수 상단 백돌 따내기',
          mission: '도망치려는 백돌을 막고 돌을 따내 호수를 건너라!',
          hint: '위쪽 마지막 활로를 클릭하세요.',
          gateActionName: '🌀 솟구치는 에어타임 언덕 & 용암 호수 횡단!',
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
          t: 0.54,
          time: 65.0,
          solved: false,
          gateName: '제3관문: 흑요석 동굴 구석 백돌 따내기',
          mission: '구석에 갇혀 활로가 1개뿐인 백돌을 즉시 따내라!',
          hint: '귀의 백돌 바로 옆 활로를 클릭하세요.',
          gateActionName: '⚡ 동굴 내부 고속 S자 뱅킹 질주!',
          boardSize: 5,
          stones: [
            { x: 0, y: 4, color: 'w' },
            { x: 0, y: 3, color: 'b' }
          ],
          correct: { x: 1, y: 4 }
        },
        {
          id: 3,
          t: 0.72,
          time: 86.0,
          solved: false,
          gateName: '제4관문: 뭉친 백 2점 한 번에 따내기',
          mission: '숨구멍이 1개 남은 백돌 2점을 한 방에 모두 따내라!',
          hint: '아래쪽 남은 활로 1곳을 클릭하세요.',
          gateActionName: '🌋 간헐천 상공 고공 다이브 점화!',
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
          t: 0.88,
          time: 108.0,
          solved: false,
          gateName: '제5관문: 화산 대폭발 최종 탈출 따내기',
          mission: '마지막 단수 백돌을 따내고 폭발하는 화산을 탈출하라!',
          hint: '백돌의 마지막 숨구멍을 클릭하세요.',
          gateActionName: '🚀 최고속 탈출 & 화산 런 대성공 골인!',
          boardSize: 5,
          stones: [
            { x: 3, y: 3, color: 'w' },
            { x: 3, y: 2, color: 'b' },
            { x: 2, y: 3, color: 'b' },
            { x: 4, y: 3, color: 'b' }
          ],
          correct: { x: 3, y: 4 }
        }
      ]
    }
,
    wood: {
      id: 'wood',
      engineType: 'video',
      title: '🪵 제4코스: 깊은 숲속 우든 런',
      theme: '나무 레일의 덜컹거리는 야생 진동 & 숲속 터널 급강하 (InvadR)',
      videoSrc: 'assets/coaster_real_wood.mp4',
      gates: [
        {
          id: 0,
          time: 41.5,
          solved: false,
          gateName: '제1관문: 숲속 정상 목재 터널 급강하',
          mission: '단수에 걸린 백돌을 따내고 덜컹거리는 나무 터널로 돌진하라!',
          hint: '백돌의 마지막 남은 활로 1곳을 찾아 클릭하세요.',
          gateActionName: '🪵 나무 레일 진동 & 숲속 어두운 터널 수직 다이브!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 2, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' }
          ],
          correct: { x: 2, y: 3 }
        },
        {
          id: 1,
          time: 60.2,
          solved: false,
          gateName: '제2관문: 나무 기둥 숲 에어타임 언덕',
          mission: '독립된 두 집을 만드는 급소에 착수하여 나무 기둥 숲을 뚫어라!',
          hint: '가운데 급소에 두어 완벽한 두 집을 완성하세요.',
          gateActionName: '🌀 솟구치는 에어타임 & 나무 구조물 사이 폭풍 질주!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 2, y: 0, color: 'w' }, { x: 2, y: 4, color: 'w' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          time: 78.0,
          solved: false,
          gateName: '제3관문: 파이널 우든 뱅킹 턴',
          mission: '먹여치기 한 수로 백의 수를 줄이고 최종 결승선으로 골인하라!',
          hint: '상대의 호구 속에 과감히 내 돌을 하나 희생시키세요.',
          gateActionName: '🚀 나무 레일 최고속 질주 & 최종 완주 성공!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' }, { x: 1, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 1, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' }, { x: 2, y: 0, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        }
      ]
    }
  };

  window.COASTER_COURSES = COASTER_COURSES;
})(window);