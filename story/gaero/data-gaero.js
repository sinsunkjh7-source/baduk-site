/**
 * Paper Theater Story Data: 개로왕과 도림 (蓋鹵王과 道琳)
 * =======================================================
 * - [명품 시네마틱 아트북 (Cinematic Art E-Book) 방식]
 * - 억지스러운 조각 인형극 모션을 배제하고, 한 폭의 예술 작품 같은
 *   마스터급 전면 회화 일러스트와 영화적 카메라 워크(Ken Burns Effect) 탑재!
 * 
 * 샷 구성:
 *   1장: [왕의 일상] 백제 궁궐에서 바둑 삼매경에 빠진 개로왕의 평화로운 모습 (부드러운 슬로우 줌인)
 *   2장: [운명적 첫 대면] 도림의 공손한 알현과 바둑 고수를 반기는 개로왕 (도림에서 왕으로 우아한 팬)
 *   3장: [로우앵글 대국 클로즈업] 도림의 침착한 착수 손길과 긴장감 넘치는 바둑판 (손에서 바둑알로 집중)
 *   4장: [익스트림 리액션 클로즈업] 신의 한 수에 넋을 잃은 개로왕의 경탄 표정 (왕의 눈빛으로 강렬한 슬로우 푸시인)
 *   5장: [음모의 미디엄 클로즈업] 왕의 귓가에 은밀히 계책을 속삭이는 도림 (도림의 미소에서 왕의 수긍으로 이동)
 *   6장: [시네마틱 전쟁 파노라마] 저녁 노을 붉은 성곽을 향해 진격하는 고구려 기병대 (대각선 파노라마 트래킹)
 *   7장: [여운의 풀 샷] 햇살이 비치는 텅 빈 대청마루와 홀로 남겨진 바둑판 (바둑판으로 서서히 줌아웃되는 역사적 교훈)
 */

(function () {
  'use strict';

  window.STORY_GAERO = {
    id: 'gaero',
    title: '개로왕과 도림',
    hanja: '蓋鹵王과 道琳',
    badge: '🎬 명품 시네마틱 아트북 · 삼국유사',
    summary: '바둑을 사랑한 백제 개로왕과 고구려 첩보 승려 도림의 역사 속 신비로운 바둑 대결',
    duration: 98.6,

    scenes: [
      {
        id: 'gaero_s1',
        start: 0,
        end: 13.0,
        chapter: '제1장 · 바둑을 사랑한 왕',
        subtitle: '옛날 옛적, 아름다운 백제 땅에 바둑을 너무나도 사랑한 임금님, 개로왕이 살고 있었답니다.',
        audio: 'assets/gaero_s1.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/scene_gaero_studying.jpg', alt: '바둑 삼매경에 빠진 백제 개로왕', className: 'cinematic-art-frame frame-s1' },
          { type: 'custom', content: '<div class="cinematic-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var frame = slideEl.querySelector('.frame-s1 img');

          // [미디엄 샷: 궁궐의 따스한 아침 햇살과 바둑에 몰입한 개로왕의 온화한 미소로 슬로우 줌인]
          if (frame) {
            var scale = 1.02 + p * 0.10;
            var panX = -p * 18;
            var panY = -p * 8;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, ' + panY.toFixed(1) + 'px, 0)';
          }

          if (isPlaying && engine && engine.triggerOnce && p > 0.08) {
            engine.triggerOnce('gaero_s1_chime', function () { engine.playSFX('chime'); });
          }
        }
      },
      {
        id: 'gaero_s2',
        start: 13.0,
        end: 26.9,
        chapter: '제2장 · 북쪽에서 온 승려 도림',
        subtitle: '어느 날, 저 멀리 고구려에서 승려 도림이 찾아왔어요. ‘세상에서 둘도 없는 바둑을 보여드리겠습니다.’',
        audio: 'assets/gaero_s2.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/scene_dorim_arrival.jpg', alt: '승려 도림의 알현과 개로왕의 환대', className: 'cinematic-art-frame frame-s2' },
          { type: 'custom', content: '<div class="cinematic-candle-light"></div>', className: 'layer-lighting' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT) {
          var frame = slideEl.querySelector('.frame-s2 img');
          // [미디엄 투샷: 공손히 합장한 도림의 날카로운 눈빛에서, 반색하며 환영하는 옥좌의 개로왕으로 유려한 패닝]
          if (frame) {
            var scale = 1.05 + p * 0.05;
            var panX = 35 - p * 60;
            var panY = -p * 6;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, ' + panY.toFixed(1) + 'px, 0)';
          }
        }
      },
      {
        id: 'gaero_s3',
        start: 26.9,
        end: 41.6,
        chapter: '제3장 · 밤낮을 잊은 대국',
        subtitle: '궁궐 깊은 방, 두 사람의 대국이 시작되었어요! 탁! 탁! 밤이 깊어 촛불이 녹아내릴 때까지 수담이 오갔지요.',
        audio: 'assets/gaero_s3.mp3',
        particlesClass: 'blossoms',
        layers: [
          { type: 'image', src: 'assets/scene_match_closeup.jpg', alt: '촛불 아래 치열한 바둑 대국 클로즈업', className: 'cinematic-art-frame frame-s3' },
          { type: 'custom', content: '<div class="cinematic-candle-light"></div>', className: 'layer-lighting' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var frame = slideEl.querySelector('.frame-s3 img');
          var candle = slideEl.querySelector('.cinematic-candle-light');

          // [바둑판 클로즈업: 도림의 손끝에서 바둑알 교전 지점으로 서서히 밀고 들어가는 숨막히는 카메라 줌]
          if (frame) {
            var scale = 1.02 + p * 0.12;
            var panX = 15 - p * 25;
            var panY = -p * 15;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, ' + panY.toFixed(1) + 'px, 0)';
          }

          if (candle) {
            candle.style.opacity = (0.35 + Math.sin(globalT * 3.5) * 0.15).toFixed(2);
          }

          // 착수 순간에 정확히 선명한 바둑돌 '탁!' 효과음 트리거
          if (isPlaying && engine && engine.triggerOnce) {
            if (p > 0.15) engine.triggerOnce('gaero_stone_1', function () { engine.playSFX('stone'); });
            if (p > 0.45) engine.triggerOnce('gaero_stone_2', function () { engine.playSFX('stone'); });
            if (p > 0.75) engine.triggerOnce('gaero_stone_3', function () { engine.playSFX('stone'); });
          }
        }
      },
      {
        id: 'gaero_s4',
        start: 41.6,
        end: 56.7,
        chapter: '제4장 · 도림의 신의 한 수',
        subtitle: '도림의 깊고 절묘한 수에 개로왕은 넋을 완전히 잃고 말았어요. ‘오오, 국수 도림이여! 그대의 한 수가 참으로 신통하구려!’',
        audio: 'assets/gaero_s4.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/scene_match_closeup.jpg', alt: '감탄하는 개로왕의 표정과 도림의 착수', className: 'cinematic-art-frame frame-s4' },
          { type: 'custom', content: '<div class="cinematic-candle-light"></div>', className: 'layer-lighting' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var frame = slideEl.querySelector('.frame-s4 img');

          // [익스트림 인물 클로즈업: 바둑판에서 왕의 크게 놀란 얼굴로 시선이 부드럽게 올라가며 집중]
          if (frame) {
            var scale = 1.14 + p * 0.08;
            var panX = -25 - p * 35; // 왕의 얼굴 쪽으로 시선 이동
            var panY = -15 - p * 15;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, ' + panY.toFixed(1) + 'px, 0)';
          }

          if (isPlaying && engine && engine.triggerOnce && p > 0.2) {
            engine.triggerOnce('gaero_divine_stone', function () { engine.playSFX('stone'); });
          }
        }
      },
      {
        id: 'gaero_s5',
        start: 56.7,
        end: 69.8,
        chapter: '제5장 · 숨겨진 계책',
        subtitle: '하지만, 도림에게는 속셈이 있었어요. 왕에게 거대한 토목공사를 속삭였고, 백성들은 힘든 노역에 지쳐만 갔지요.',
        audio: 'assets/gaero_s5.mp3',
        particlesClass: 'autumn',
        layers: [
          { type: 'image', src: 'assets/scene_whispering_plot.jpg', alt: '왕의 귀에 은밀히 속삭이는 도림', className: 'cinematic-art-frame frame-s5' },
          { type: 'custom', content: '<div class="cinematic-candle-light"></div>', className: 'layer-lighting' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT) {
          var frame = slideEl.querySelector('.frame-s5 img');
          // [음모의 투샷: 도림의 은밀한 귓속말과 왕의 귀 기울임 사이를 서서히 트래킹]
          if (frame) {
            var scale = 1.03 + p * 0.09;
            var panX = -15 + p * 25;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, 0, 0)';
          }
        }
      },
      {
        id: 'gaero_s6',
        start: 69.8,
        end: 85.7,
        chapter: '제6장 · 북풍과 함께 닥친 위기',
        subtitle: '백제의 힘이 약해진 바로 그 순간! 도림은 사라졌고, 북쪽에서 고구려 장수왕의 군사들이 들이닥쳤어요.',
        audio: 'assets/gaero_s6.mp3',
        particlesClass: 'autumn',
        layers: [
          { type: 'image', src: 'assets/bg_goguryeo_march.jpg', alt: '노을 빛 산성을 진격하는 고구려 대군', className: 'cinematic-art-frame frame-s6' },
          { type: 'custom', content: '<div class="cinematic-crisis-vignette"></div>', className: 'layer-crisis' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var frame = slideEl.querySelector('.frame-s6 img');
          var crisis = slideEl.querySelector('.cinematic-crisis-vignette');
          var pines = slideEl.querySelector('.layer-pines');

          // [전쟁 파노라마: 어두운 산성 능선을 따라 진격하는 군사들을 대각선으로 와이드 트래킹]
          if (frame) {
            var scale = 1.04 + p * 0.1;
            var panX = 40 - p * 70;
            var panY = -p * 20;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(' + panX.toFixed(1) + 'px, ' + panY.toFixed(1) + 'px, 0)';
          }

          if (crisis) {
            crisis.style.opacity = (0.4 + Math.sin(globalT * 3.0) * 0.25).toFixed(2);
          }
          if (pines) {
            pines.style.transform = 'translate3d(' + (-p * 30).toFixed(1) + 'px, 0, 0)';
          }

          if (isPlaying && engine && engine.triggerOnce && p > 0.12) {
            engine.triggerOnce('gaero_s6_crumble', function () { engine.playSFX('crumble'); });
          }
        }
      },
      {
        id: 'gaero_s7',
        start: 85.7,
        end: 98.6,
        chapter: '제7장 · 역사에 새겨진 교훈',
        subtitle: '바둑은 깊은 지혜와 즐거움을 주지만, 지켜야 할 본분을 잊어서는 안 된다는 깊은 교훈을 남겨주고 있답니다.',
        audio: 'assets/gaero_s7.mp3',
        particlesClass: 'blossoms',
        layers: [
          { type: 'image', src: 'assets/scene_lonely_board.jpg', alt: '햇살이 비치는 텅 빈 궁궐과 바둑판', className: 'cinematic-art-frame frame-s7' },
          { type: 'custom', content: '<div class="cinematic-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<div class="cinematic-vignette"></div>', className: 'layer-vignette' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var frame = slideEl.querySelector('.frame-s7 img');
          var beam = slideEl.querySelector('.cinematic-sunbeam');

          // [시네마틱 엔딩: 바둑판과 바닥에 떨어진 돌에서 시작해, 따스한 햇살이 비치는 고요한 전경으로 슬로우 줌아웃]
          if (frame) {
            var scale = 1.15 - p * 0.12; // 여운을 남기며 천천히 줌아웃
            var panY = -20 + p * 20;
            frame.style.transform = 'scale(' + scale.toFixed(3) + ') translate3d(0, ' + panY.toFixed(1) + 'px, 0)';
          }

          if (beam) {
            beam.style.opacity = (0.2 + p * 0.45).toFixed(2);
          }

          if (isPlaying && engine && engine.triggerOnce && p > 0.15) {
            engine.triggerOnce('gaero_s7_chime', function () { engine.playSFX('chime'); });
          }
        }
      }
    ],

    study: {
      hanja: [
        { char: '蓋', meaning: '덮을 개' },
        { char: '鹵', meaning: '소금밭 로' },
        { char: '道', meaning: '길 도' },
        { char: '琳', meaning: '옥 림' }
      ],
      badukWisdom: '‘바둑의 즐거움에 빠져 자신의 본분을 잊지 마라.’ 바둑은 생각의 힘과 마음을 닦는 훌륭한 놀이지만, 학생으로서의 공부와 일상생활의 균형을 지키는 절제가 무엇보다 중요하답니다.',
      quiz: {
        question: '백제 개로왕 이야기에서 배울 수 있는 올바른 바둑의 자세는 무엇일까요?',
        options: [
          { text: '바둑만 하루 종일 밤새워 두기', correct: false },
          { text: '바둑의 즐거움을 즐기되 본분과 일상의 균형을 지키기', correct: true },
          { text: '상대방에게 바둑을 무조건 이기려고만 하기', correct: false }
        ],
        correctMsg: '🎉 정답입니다! 바둑을 사랑하되, 자신의 할 일을 성실히 지키는 균형 있는 태도가 가장 중요합니다.',
        wrongMsg: '개로왕이 바둑에 너무 깊이 빠져 나라 일을 돌보지 못했던 결과를 떠올려 보세요!'
      }
    }
  };
})();
