/**
 * Paper Theater Story Data: 개로왕과 도림 (蓋鹵王과 道琳)
 * =======================================================
 * - 백제 개로왕과 고구려 첩보 승려 도림의 역사 속 흥미진진한 바둑 이야기
 * - 6~7겹 독립 레이어: 궁궐 배경, 원경 산맥, 촛불 오라, 실시간 착수 바둑판, 개로왕·도림 컷아웃, 전경 소나무 프레임
 * - 따뜻하고 실감나는 구연동화 내레이션 (총 7장, 98.6초)
 */

(function () {
  'use strict';

  var STONE_COORDS = [
    { x: 30, y: 32, c: 'black' },
    { x: 70, y: 34, c: 'white' },
    { x: 35, y: 68, c: 'black' },
    { x: 68, y: 65, c: 'white' },
    { x: 50, y: 50, c: 'black' },
    { x: 42, y: 44, c: 'white' },
    { x: 58, y: 42, c: 'black' },
    { x: 44, y: 58, c: 'white' }
  ];

  function buildLiveBoardHTML() {
    var html = '<div class="gaero-live-board">';
    for (var i = 0; i < STONE_COORDS.length; i++) {
      var s = STONE_COORDS[i];
      html += '<span class="gaero-stone ' + s.c + '" data-stone-idx="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%;"></span>';
    }
    html += '</div>';
    return html;
  }

  function updateLiveBoard(slideEl, p, baseCount, addCount, isPlaying, engine, sfxPrefix) {
    var board = slideEl.querySelector('.gaero-live-board');
    if (!board) return;
    var stones = board.querySelectorAll('.gaero-stone');
    var extra = Math.floor(p * (addCount + 0.99));
    var visibleCount = Math.min(stones.length, baseCount + extra);
    for (var i = 0; i < stones.length; i++) {
      var placed = i < visibleCount;
      stones[i].classList.toggle('placed', placed);
      stones[i].classList.toggle('latest', i === visibleCount - 1 && i >= baseCount);
      if (placed && i >= baseCount && isPlaying && engine && engine.triggerOnce) {
        (function (idx) {
          engine.triggerOnce(sfxPrefix + '_stone_' + idx, function () {
            engine.playSFX('stone');
          });
        })(i);
      }
    }
  }

  window.STORY_GAERO = {
    id: 'gaero',
    title: '개로왕과 도림',
    hanja: '蓋鹵王과 道琳',
    badge: '🎬 다층 종이 극장 · 삼국유사 역사 전설',
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '백제 궁궐 대청마루 배경', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
          { type: 'custom', content: '<img src="assets/cutout_gaero.png" alt="바둑돌을 쥐고 몰입하는 개로왕" class="gaero-king-sprite" draggable="false">', className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 창틀 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.gaero-palace-bg');
          var king = slideEl.querySelector('.gaero-king-sprite');
          var glow = slideEl.querySelector('.gaero-candle-glow');
          var pines = slideEl.querySelector('.layer-pines');

          if (bg) bg.style.transform = 'scale(' + (1.02 + p * 0.05).toFixed(3) + ') translate3d(' + (-p * 14).toFixed(1) + 'px, 0, 0)';
          if (king) {
            var breathe = Math.sin(globalT * 1.8) * 2.2;
            king.style.transform = 'translate3d(' + (-p * 18).toFixed(1) + 'px, ' + breathe.toFixed(1) + 'px, 0) scale(' + (0.96 + p * 0.04).toFixed(3) + ')';
          }
          if (glow) glow.style.opacity = (0.5 + Math.sin(globalT * 2.2) * 0.2).toFixed(2);
          if (pines) pines.style.transform = 'scale(' + (1.02 + p * 0.05).toFixed(3) + ') translateX(' + (p * 12).toFixed(1) + 'px)';

          if (isPlaying && engine && engine.triggerOnce && p > 0.1) {
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '백제 궁궐 대청마루 배경', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_dorim.png" alt="고구려 승려 도림의 등장" class="gaero-dorim-sprite" draggable="false">', className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_gaero.png" alt="반갑게 맞이하는 개로왕" class="gaero-king-sprite" draggable="false">', className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.gaero-palace-bg');
          var dorim = slideEl.querySelector('.gaero-dorim-sprite');
          var king = slideEl.querySelector('.gaero-king-sprite');

          if (bg) bg.style.transform = 'scale(' + (1.04 + p * 0.04).toFixed(3) + ')';
          if (dorim) {
            var walkIn = -60 + Math.min(1, p * 2.2) * 60;
            dorim.style.transform = 'translate3d(' + walkIn.toFixed(1) + 'px, 0, 0) scale(0.96)';
          }
          if (king) {
            var lean = Math.sin(globalT * 1.5) * 1.5;
            king.style.transform = 'translate3d(0, ' + lean.toFixed(1) + 'px, 0) scale(0.98)';
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '궁궐 바둑방', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_dorim.png" alt="침착하게 수를 놓는 도림" class="gaero-dorim-sprite" draggable="false">', className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<div class="gaero-board-wrap"><img src="assets/cutout_board.png" alt="조선식 향나무 바둑판"></div>', className: 'layer-board-prop' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-live-stones' },
          { type: 'custom', content: '<img src="assets/cutout_gaero.png" alt="열중하는 개로왕" class="gaero-king-sprite" draggable="false">', className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var dorim = slideEl.querySelector('.gaero-dorim-sprite');
          var king = slideEl.querySelector('.gaero-king-sprite');
          var boardProp = slideEl.querySelector('.gaero-board-wrap');

          if (dorim) dorim.style.transform = 'translate3d(' + (p * 15).toFixed(1) + 'px, 0, 0) scale(0.97)';
          if (king) king.style.transform = 'translate3d(' + (-p * 15).toFixed(1) + 'px, 0, 0) scale(0.98)';
          if (boardProp) boardProp.style.transform = 'scale(' + (0.98 + p * 0.04).toFixed(3) + ')';

          updateLiveBoard(slideEl, p, 0, 4, isPlaying, engine, 'gaero_s3');
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '궁궐 바둑방', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_dorim.png" alt="미소 짓는 도림" class="gaero-dorim-sprite" draggable="false">', className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<div class="gaero-board-wrap"><img src="assets/cutout_board.png" alt="바둑판"></div>', className: 'layer-board-prop' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-live-stones' },
          { type: 'custom', content: '<img src="assets/cutout_gaero.png" alt="감탄하는 개로왕" class="gaero-king-sprite" draggable="false">', className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var king = slideEl.querySelector('.gaero-king-sprite');
          var dorim = slideEl.querySelector('.gaero-dorim-sprite');

          if (king) king.style.transform = 'translate3d(-20px, 0, 0) scale(' + (1.0 + p * 0.04).toFixed(3) + ')';
          if (dorim) dorim.style.transform = 'translate3d(18px, ' + (Math.sin(globalT * 1.6) * 1.5).toFixed(1) + 'px, 0) scale(0.98)';

          updateLiveBoard(slideEl, p, 4, 4, isPlaying, engine, 'gaero_s4');
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '궁궐 밖 전경', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'custom', content: '<img src="assets/cutout_dorim.png" alt="왕에게 속삭이는 도림" class="gaero-dorim-sprite" draggable="false">', className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_gaero.png" alt="고민 없이 수긍하는 개로왕" class="gaero-king-sprite" draggable="false">', className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT) {
          var dorim = slideEl.querySelector('.gaero-dorim-sprite');
          var king = slideEl.querySelector('.gaero-king-sprite');
          if (dorim) dorim.style.transform = 'translate3d(' + (35 + p * 20).toFixed(1) + 'px, 0, 0) scale(0.99)';
          if (king) king.style.transform = 'translate3d(' + (-p * 12).toFixed(1) + 'px, 0, 0) scale(0.97)';
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
          { type: 'image', src: 'assets/bg_goguryeo_march.jpg', alt: '고구려 군사의 진격', className: 'gaero-march-bg' },
          { type: 'custom', content: '<div class="gaero-crisis-tint"></div>', className: 'layer-crisis' },
          { type: 'custom', content: '<div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.gaero-march-bg');
          var tint = slideEl.querySelector('.gaero-crisis-tint');
          var pines = slideEl.querySelector('.layer-pines');

          if (bg) bg.style.transform = 'scale(' + (1.02 + p * 0.08).toFixed(3) + ') translate3d(' + (-p * 24).toFixed(1) + 'px, 0, 0)';
          if (tint) tint.style.opacity = (0.35 + Math.sin(globalT * 3.5) * 0.25).toFixed(2);
          if (pines) pines.style.transform = 'scale(' + (1.03 + p * 0.05).toFixed(3) + ') translateX(' + (-p * 18).toFixed(1) + 'px)';

          if (isPlaying && engine && engine.triggerOnce && p > 0.15) {
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
          { type: 'image', src: 'assets/bg_palace_room.jpg', alt: '노을 지는 궁궐과 산맥', className: 'gaero-palace-bg' },
          { type: 'custom', content: '<div class="s5-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<div class="gaero-board-wrap" style="left:40%;"><img src="assets/cutout_board.png" alt="혼자 남겨진 바둑판"></div>', className: 'layer-board-prop' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.gaero-palace-bg');
          var beam = slideEl.querySelector('.s5-sunbeam');
          var boardProp = slideEl.querySelector('.gaero-board-wrap');

          if (bg) bg.style.transform = 'scale(' + (1.0 + p * 0.05).toFixed(3) + ')';
          if (beam) beam.style.opacity = (0.3 + p * 0.5).toFixed(2);
          if (boardProp) boardProp.style.transform = 'scale(' + (0.95 + p * 0.06).toFixed(3) + ')';

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
