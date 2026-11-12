/**
 * courses.js - 100% 순수 3D WebGL 롤러코스터 바둑 코스 설정
 * 
 * 1코스: ❄️ 프로즌 글래시어 런 (만년설 빙하 & 155m 설산 수직 다이브 3D)
 * 2코스: 🔥 마그마 화산 런 (용암 바다 & 155m 분화구 정점 수직 다이브 3D)
 * 3코스: 🌌 은하계 심우주 런 (암흑 우주 & 토성 고리 워프 질주 3D)
 * 4코스: 🚀 우주 사활 1분 런 (초거대 항성 충돌 & 10×10 실전 사활 1분 익스트림 3D)
 */
(function(window) {
  'use strict';

  window.COASTER_COURSES = {
    // ❄️ 1코스: 프로즌 글래시어 런 (3D 만년설 설산 테마)
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
          mission: '용암 호수를 넘어 카멜백 언덕을 무중력으로 돌파하라!',
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

    // 🌌 3코스: 은하계 심우주 런 (먼저 만든 3D 우주런 원본 / 5×5)
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
    },

    // 🚀 4코스: 우주 사활 1분 런 (새로 만든 1분 익스트림 / 10×10)
    space_epic: {
      id: 'space_epic',
      engineType: 'space',
      title: '🚀 제4코스: 우주 사활 1분 런',
      theme: '불타는 초거대 항성 충돌 & 운석 슬라롬 (10×10 실전 사활)',
      gates: [
        {
          id: 0,
          t: 0.15,
          time: 25.0,
          solved: false,
          gateName: '제1관문: 토성 고리 조망 정점! 행마 A·B 선택',
          mission: '토성 얼음 고리로 210km/h 급강하하기 직전! 실전 행마 급소(A)를 찔러 워프 부스터를 점화하라!',
          hint: '백돌의 머리를 막아 퇴로를 차단하는 A(왼쪽 아래)를 클릭하세요.',
          gateActionName: '🪐 토성 얼음 고리 관통 210km/h 초광속 다이브!',
          boardSize: 10,
          stones: [
            { x: 6, y: 4, color: 'b' },
            { x: 5, y: 6, color: 'b' },
            { x: 5, y: 7, color: 'w' },
            { x: 7, y: 6, color: 'w' }
          ],
          labels: [
            { x: 4, y: 7, text: 'A' },
            { x: 3, y: 6, text: 'B' }
          ],
          correct: { x: 4, y: 7 }
        },
        {
          id: 1,
          t: 0.31,
          time: 25.0,
          solved: false,
          gateName: '제2관문: 소행성대 운석 슬라롬! 귀의 두 집 만들기',
          mission: '거대 운석이 스칠 듯이 쏟아진다! 귀에서 완벽한 독립된 두 집을 완성하여 회피 궤도를 열어라!',
          hint: '귀의 급소 (1, 1) 빈칸을 찾아 완벽한 두 집을 만드세요.',
          gateActionName: '☄️ 거대 암석 운석 회피 180km/h 고속 슬라롬!',
          boardSize: 10,
          stones: [
            { x: 0, y: 1, color: 'b' }, { x: 0, y: 2, color: 'b' },
            { x: 1, y: 2, color: 'b' }, { x: 2, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' }, { x: 2, y: 0, color: 'b' },
            { x: 0, y: 3, color: 'w' }, { x: 1, y: 3, color: 'w' },
            { x: 2, y: 3, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 3, y: 1, color: 'w' }, { x: 3, y: 0, color: 'w' }
          ],
          correct: { x: 1, y: 1 }
        },
        {
          id: 2,
          t: 0.48,
          time: 25.0,
          solved: false,
          gateName: '제3관문: 불타는 항성 코로나 초근접! 촉촉수 단수',
          mission: '태양 코로나 충돌 직전 250km/h 다이브! 백돌의 연결을 끊는 끼움수로 연단수를 몰아라!',
          hint: '백돌의 연결을 가르는 급소 빈칸을 찌르세요.',
          gateActionName: '☀️ 250km/h 태양 중력 슬링샷 70도 급선회 탈출!',
          boardSize: 10,
          stones: [
            { x: 4, y: 4, color: 'w' }, { x: 5, y: 4, color: 'w' }, { x: 5, y: 5, color: 'w' },
            { x: 3, y: 4, color: 'b' }, { x: 4, y: 3, color: 'b' }, { x: 5, y: 3, color: 'b' },
            { x: 6, y: 4, color: 'b' }, { x: 6, y: 5, color: 'b' }, { x: 5, y: 6, color: 'b' }
          ],
          correct: { x: 4, y: 5 }
        },
        {
          id: 3,
          t: 0.65,
          time: 25.0,
          solved: false,
          gateName: '제4관문: 오리온 자색 성운 360도 헬릭스! 환격의 덫',
          mission: '자색 가스 구름 속 코르크스크류 헬릭스 진입! 돌을 희생해 백 3점을 통째로 잡는 환격을 걸어라!',
          hint: '호구 안쪽으로 과감히 먹여치는 급소를 클릭하세요.',
          gateActionName: '🌀 360도 성운 나선 코르크스크류 고속 급강하!',
          boardSize: 10,
          stones: [
            { x: 3, y: 2, color: 'w' }, { x: 4, y: 2, color: 'w' }, { x: 5, y: 2, color: 'w' },
            { x: 2, y: 2, color: 'b' }, { x: 3, y: 1, color: 'b' }, { x: 4, y: 1, color: 'b' },
            { x: 5, y: 1, color: 'b' }, { x: 6, y: 2, color: 'b' }, { x: 5, y: 3, color: 'b' },
            { x: 3, y: 3, color: 'b' }
          ],
          correct: { x: 4, y: 3 }
        },
        {
          id: 4,
          t: 0.82,
          time: 25.0,
          solved: false,
          gateName: '제5관문: 유성우 회피 에어타임 언덕! 장문 포위망',
          mission: '돌진하는 거대 유성을 피해 솟구친다! 도망치려는 백돌의 머리 위에 그물을 씌워라!',
          hint: '백돌의 탈출로를 완전히 덮는 장문의 맥점을 클릭하세요.',
          gateActionName: '⚡ 유성우 돌파 하이퍼드라이브 충전 가속!',
          boardSize: 10,
          stones: [
            { x: 4, y: 5, color: 'w' },
            { x: 3, y: 4, color: 'b' }, { x: 3, y: 5, color: 'b' }, { x: 5, y: 6, color: 'b' }
          ],
          correct: { x: 5, y: 4 }
        },
        {
          id: 5,
          t: 0.94,
          time: 25.0,
          solved: false,
          gateName: '제6관문: 초광속 웜홀 결승 관문! 치중 사활 결정타',
          mission: '마지막 웜홀 게이트 개방! 백 대마의 한 집을 옥집으로 만드는 결정적 치중타를 날려라!',
          hint: '백 대마의 중심 안형을 파괴하는 치중점 (7, 6)을 찌르세요.',
          gateActionName: '🚀 300km/h 초광속 하이퍼스페이스 최종 웜홀 탈출!',
          boardSize: 10,
          stones: [
            { x: 5, y: 5, color: 'w' }, { x: 6, y: 5, color: 'w' }, { x: 7, y: 5, color: 'w' }, { x: 8, y: 5, color: 'w' },
            { x: 5, y: 7, color: 'w' }, { x: 6, y: 7, color: 'w' }, { x: 7, y: 7, color: 'w' }, { x: 8, y: 7, color: 'w' },
            { x: 4, y: 6, color: 'b' }, { x: 5, y: 4, color: 'b' }, { x: 6, y: 4, color: 'b' }, { x: 7, y: 4, color: 'b' },
            { x: 8, y: 4, color: 'b' }, { x: 9, y: 6, color: 'b' }, { x: 5, y: 8, color: 'b' }, { x: 6, y: 8, color: 'b' },
            { x: 7, y: 8, color: 'b' }, { x: 8, y: 8, color: 'b' }
          ],
          correct: { x: 7, y: 6 }
        }
      ]
    },

    // ☄️ 5코스: 운석 충돌 30초 사활 런 (5문제 / 3회 오답 시 정지)
    space_meteor: {
      id: 'space_meteor',
      engineType: 'space',
      speedScale: 2.0,
      title: '☄️ 제5코스: 운석 충돌 30초 사활 런',
      theme: '30초 초고속 우주 항해 & 5대 사활 돌파 (3회 오답 시 운석 충돌 정지)',
      gates: [
        {
          id: 0,
          t: 0.14,
          time: 15.0,
          solved: false,
          gateName: '제1관문: 운석지대 진입! 단수 백돌 따내기',
          mission: '앞을 막는 백돌을 한 수로 따내고 운석지대를 돌파하라!',
          hint: '백돌의 마지막 숨구멍(아래쪽)을 클릭하세요.',
          gateActionName: '⚡ 1단계 워프 부스터! 운석지대 돌파!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' },
            { x: 1, y: 2, color: 'b' },
            { x: 3, y: 2, color: 'b' },
            { x: 2, y: 1, color: 'b' }
          ],
          correct: { x: 2, y: 3 }
        },
        {
          id: 1,
          t: 0.32,
          time: 15.0,
          solved: false,
          gateName: '제2관문: 소행성 벨트! 3칸 궁도 두 집 살리기',
          mission: '운석 폭풍 속에서 흑 대마를 살리는 급소(두 집)를 찾아라!',
          hint: '3칸 빈자리의 정중앙에 두어 두 집을 만드세요.',
          gateActionName: '🌀 소행성 벨트 급선회 회피 성공!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'b' }, { x: 2, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 0, y: 2, color: 'b' }, { x: 4, y: 2, color: 'b' },
            { x: 0, y: 1, color: 'w' }, { x: 4, y: 1, color: 'w' },
            { x: 0, y: 3, color: 'w' }, { x: 4, y: 3, color: 'w' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 2,
          t: 0.50,
          time: 15.0,
          solved: false,
          gateName: '제3관문: 유성우 돌파! 먹여치기 한 수',
          mission: '내 돌 하나를 과감히 던져 백돌을 단수로 몰아라!',
          hint: '호구 속 빈칸(중앙)으로 먹여치기 하세요.',
          gateActionName: '🔥 유성우 정면 돌파! 하이퍼 가속!',
          boardSize: 5,
          stones: [
            { x: 2, y: 1, color: 'w' }, { x: 1, y: 2, color: 'w' }, { x: 3, y: 2, color: 'w' },
            { x: 1, y: 1, color: 'b' }, { x: 3, y: 1, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 2, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 3,
          t: 0.68,
          time: 15.0,
          solved: false,
          gateName: '제4관문: 암흑 성운! 백 대마 치중 급소',
          mission: '백의 3칸 궁도 한가운데를 찔러 두 집을 없애버려라!',
          hint: '백 안형의 정중앙 급소에 치중하세요.',
          gateActionName: '💫 암흑 성운 중력 슬링샷 탈출!',
          boardSize: 5,
          stones: [
            { x: 1, y: 1, color: 'w' }, { x: 2, y: 1, color: 'w' }, { x: 3, y: 1, color: 'w' },
            { x: 1, y: 3, color: 'w' }, { x: 2, y: 3, color: 'w' }, { x: 3, y: 3, color: 'w' },
            { x: 0, y: 2, color: 'w' }, { x: 4, y: 2, color: 'w' },
            { x: 1, y: 0, color: 'b' }, { x: 2, y: 0, color: 'b' }, { x: 3, y: 0, color: 'b' },
            { x: 1, y: 4, color: 'b' }, { x: 2, y: 4, color: 'b' }, { x: 3, y: 4, color: 'b' }
          ],
          correct: { x: 2, y: 2 }
        },
        {
          id: 4,
          t: 0.86,
          time: 15.0,
          solved: false,
          gateName: '제5관문: 최종 귀환 워프! 백 2점 포획',
          mission: '마지막 백 2점을 따내고 지구 귀환 웜홀을 열어라!',
          hint: '백 2점의 마지막 남은 활로(아래쪽)를 막으세요.',
          gateActionName: '🚀 초광속 지구 귀환 워프 성공!',
          boardSize: 5,
          stones: [
            { x: 2, y: 2, color: 'w' }, { x: 2, y: 3, color: 'w' },
            { x: 1, y: 2, color: 'b' }, { x: 3, y: 2, color: 'b' },
            { x: 1, y: 3, color: 'b' }, { x: 3, y: 3, color: 'b' },
            { x: 2, y: 1, color: 'b' }
          ],
          correct: { x: 2, y: 4 }
        }
      ]
    }
  };
})(window);
