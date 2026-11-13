/**
 * Paper Theater Story Data: 개로왕과 도림 (蓋鹵王과 道琳)
 * =======================================================
 * - [방식 1: 관절 분리 페이퍼 퍼펫 탑재]
 *   1) 도림 (Dorim): 머리(끄덕임/기울기) + 오른팔(바둑판으로 뻗어 돌을 딱! 놓는 관절 회전) + 몸통
 *   2) 개로왕 (Gaero): 왕관 머리(놀람/감탄 고개짓) + 손목/팔(착수 손짓) + 웅장한 몸체
 *   3) 창밖 풍경 ↔ 전각 기둥 ↔ 바둑판 ↔ 관절 인물 ↔ 전경 소나무 7겹 완벽 연동
 *   4) 6장 고구려 기병 돌격 + 카메라 지진 셰이크
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

  function buildDorimPuppetHTML() {
    return [
      '<div class="puppet-dorim">',
      '  <img src="assets/dorim_part_body.png" class="dorim-body" alt="도림 몸체" draggable="false">',
      '  <img src="assets/dorim_part_head.png" class="dorim-head" alt="도림 머리 관절" draggable="false">',
      '  <img src="assets/dorim_part_arm.png" class="dorim-arm" alt="도림 착수 팔 관절" draggable="false">',
      '</div>'
    ].join('\n');
  }

  function buildGaeroPuppetHTML() {
    return [
      '<div class="puppet-gaero">',
      '  <img src="assets/gaero_part_body.png" class="gaero-body" alt="개로왕 몸체" draggable="false">',
      '  <img src="assets/gaero_part_head.png" class="gaero-head" alt="개로왕 왕관 머리 관절" draggable="false">',
      '  <img src="assets/gaero_part_arm.png" class="gaero-arm" alt="개로왕 손 관절" draggable="false">',
      '</div>'
    ].join('\n');
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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="성곽과 산맥 원경"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥과 난간 중경', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
          { type: 'custom', content: buildGaeroPuppetHTML(), className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 창틀 전경', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var scenery = slideEl.querySelector('.gaero-window-scenery img');
          var frame = slideEl.querySelector('.gaero-palace-frame');
          var puppet = slideEl.querySelector('.puppet-gaero');
          var head = slideEl.querySelector('.puppet-gaero .gaero-head');
          var arm = slideEl.querySelector('.puppet-gaero .gaero-arm');
          var pines = slideEl.querySelector('.layer-pines');

          if (scenery) scenery.style.transform = 'translate3d(' + (-p * 35).toFixed(1) + 'px, 0, 0) scale(' + (1.0 + p * 0.05).toFixed(3) + ')';
          if (frame) frame.style.transform = 'scale(' + (1.0 + p * 0.08).toFixed(3) + ') translate3d(' + (-p * 45).toFixed(1) + 'px, 0, 0)';

          // [관절 퍼펫 모션] 개로왕의 몸통 전진, 머리 끄덕임, 손가락 돌 쥐기 까딱임
          if (puppet) {
            var breathe = Math.sin(globalT * 2.2) * 5.0;
            puppet.style.transform = 'translate3d(' + (-p * 65).toFixed(1) + 'px, ' + breathe.toFixed(1) + 'px, 0) scale(' + (0.94 + p * 0.12).toFixed(3) + ')';
          }
          if (head) {
            var headNod = Math.sin(globalT * 2.5) * 4.5;
            head.style.transform = 'rotate(' + headNod.toFixed(2) + 'deg)';
          }
          if (arm) {
            var armTwitch = Math.sin(globalT * 3.8) * 8.0;
            arm.style.transform = 'rotate(' + armTwitch.toFixed(2) + 'deg)';
          }

          if (pines) pines.style.transform = 'translate3d(' + (p * 55).toFixed(1) + 'px, 0, 0) scale(' + (1.02 + p * 0.1).toFixed(3) + ')';

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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="성곽과 산맥"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: buildDorimPuppetHTML(), className: 'layer-dorim-wrap' },
          { type: 'custom', content: buildGaeroPuppetHTML(), className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var dorim = slideEl.querySelector('.puppet-dorim');
          var dHead = slideEl.querySelector('.puppet-dorim .dorim-head');
          var dArm = slideEl.querySelector('.puppet-dorim .dorim-arm');
          var king = slideEl.querySelector('.puppet-gaero');
          var kHead = slideEl.querySelector('.puppet-gaero .gaero-head');

          // 도림이 성큼성큼 걸어 들어오며 머리를 조아려 인사!
          if (dorim) {
            var walkProgress = Math.min(1.0, p * 1.5);
            var walkX = -180 + walkProgress * 230;
            var bob = isPlaying && walkProgress < 0.98 ? Math.abs(Math.sin(globalT * 6.0)) * -10.0 : 0;
            dorim.style.transform = 'translate3d(' + walkX.toFixed(1) + 'px, ' + bob.toFixed(1) + 'px, 0) scale(0.96)';
          }
          if (dHead) {
            // 들어와서 공손히 12도 숙여 인사!
            var bow = p > 0.4 ? 12.0 : Math.sin(globalT * 3.0) * 4.0;
            dHead.style.transform = 'rotate(' + bow.toFixed(2) + 'deg)';
          }
          if (dArm) {
            var armWave = Math.sin(globalT * 2.0) * 6.0;
            dArm.style.transform = 'rotate(' + armWave.toFixed(2) + 'deg)';
          }

          // 개로왕이 반갑게 맞이하며 고개를 끄덕임
          if (king) {
            var kingLean = Math.sin(Math.min(1.0, p * 1.4) * Math.PI * 0.5) * -4.0;
            var kingShift = -Math.min(1.0, p * 1.4) * 45;
            king.style.transform = 'translate3d(' + kingShift.toFixed(1) + 'px, 0, 0) scale(0.98) rotate(' + kingLean.toFixed(2) + 'deg)';
          }
          if (kHead) {
            var kTilt = Math.sin(globalT * 2.8) * 5.0;
            kHead.style.transform = 'rotate(' + kTilt.toFixed(2) + 'deg)';
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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="궁궐 원경"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: buildDorimPuppetHTML(), className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<div class="gaero-board-wrap"><img src="assets/cutout_board.png" alt="바둑판"></div>', className: 'layer-board-prop' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-live-stones' },
          { type: 'custom', content: buildGaeroPuppetHTML(), className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var dorim = slideEl.querySelector('.puppet-dorim');
          var dHead = slideEl.querySelector('.puppet-dorim .dorim-head');
          var dArm = slideEl.querySelector('.puppet-dorim .dorim-arm');
          var king = slideEl.querySelector('.puppet-gaero');
          var kHead = slideEl.querySelector('.puppet-gaero .gaero-head');
          var kArm = slideEl.querySelector('.puppet-gaero .gaero-arm');
          var boardProp = slideEl.querySelector('.gaero-board-wrap');
          var liveStones = slideEl.querySelector('.gaero-live-board');

          var zoom = 1.0 + p * 0.12;

          if (dorim) {
            dorim.style.transform = 'translate3d(40px, 0, 0) scale(' + (0.96 * zoom).toFixed(3) + ')';
          }

          // [핵심 관절 모션: 도림이 실제로 팔을 뻗어 바둑판에 돌을 딱! 내려놓는 회전]
          if (dArm) {
            // 주기적으로 팔이 위로 들렸다가 바둑판으로 쿵 내려앉음 (착수 스트로크!)
            var strokeCycle = (localT * 1.8) % 2.0; // 2초마다 1번 착수 동작
            var armRot = strokeCycle < 0.8
              ? Math.sin(strokeCycle * Math.PI) * 18.0  // 팔을 들어 올림 (-18도)
              : (strokeCycle < 1.1 ? -12.0 : 0.0);       // 딱! 바둑판에 내려침 (+12도)
            dArm.style.transform = 'rotate(' + armRot.toFixed(2) + 'deg)';
          }

          // 도림의 수읽기 고개 기울임
          if (dHead) {
            var dTilt = Math.sin(globalT * 1.6) * 6.0;
            dHead.style.transform = 'rotate(' + dTilt.toFixed(2) + 'deg)';
          }

          if (king) {
            king.style.transform = 'translate3d(-50px, 0, 0) scale(' + (0.97 * zoom).toFixed(3) + ')';
          }

          // [개로왕의 착수 맞대응 모션: 손목을 흔들며 돌을 만지작거리다 뻗음]
          if (kArm) {
            var kArmStroke = Math.sin(globalT * 2.8) * 14.0;
            kArm.style.transform = 'rotate(' + kArmStroke.toFixed(2) + 'deg)';
          }
          if (kHead) {
            var kHeadThink = Math.sin(globalT * 2.0) * -5.0;
            kHead.style.transform = 'rotate(' + kHeadThink.toFixed(2) + 'deg)';
          }

          if (boardProp) {
            boardProp.style.transform = 'scale(' + (zoom * 1.02).toFixed(3) + ') translate3d(0, ' + (-p * 15).toFixed(1) + 'px, 0)';
          }
          if (liveStones) {
            liveStones.style.transform = 'perspective(600px) rotateX(46deg) rotateZ(45deg) scale(' + zoom.toFixed(3) + ') translate3d(0, ' + (-p * 15).toFixed(1) + 'px, 0)';
          }

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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="궁궐 원경"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="gaero-candle-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'custom', content: buildDorimPuppetHTML(), className: 'layer-dorim-wrap' },
          { type: 'custom', content: '<div class="gaero-board-wrap"><img src="assets/cutout_board.png" alt="바둑판"></div>', className: 'layer-board-prop' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-live-stones' },
          { type: 'custom', content: buildGaeroPuppetHTML(), className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var king = slideEl.querySelector('.puppet-gaero');
          var kHead = slideEl.querySelector('.puppet-gaero .gaero-head');
          var kArm = slideEl.querySelector('.puppet-gaero .gaero-arm');
          var dorim = slideEl.querySelector('.puppet-dorim');
          var dArm = slideEl.querySelector('.puppet-dorim .dorim-arm');

          // [개로왕의 놀람 & 감탄 모션: 왕관 머리를 크게 끄덕이고 손뼉을 치듯 손을 들어 올림]
          if (king) {
            var kingExcitedX = -60 - p * 30;
            king.style.transform = 'translate3d(' + kingExcitedX.toFixed(1) + 'px, 0, 0) scale(' + (1.05 + p * 0.08).toFixed(3) + ')';
          }
          if (kHead) {
            var praiseNod = Math.sin(globalT * 4.2) * 8.0;
            kHead.style.transform = 'rotate(' + praiseNod.toFixed(2) + 'deg)';
          }
          if (kArm) {
            var praiseArm = Math.sin(globalT * 3.5) * 18.0;
            kArm.style.transform = 'rotate(' + praiseArm.toFixed(2) + 'deg)';
          }

          if (dorim) {
            dorim.style.transform = 'translate3d(35px, 0, 0) scale(1.02)';
          }
          if (dArm) {
            // 도림은 신의 한 수를 딱 놓고 여유롭게 팔을 거둠
            dArm.style.transform = 'rotate(' + (Math.sin(globalT * 1.5) * 5.0).toFixed(2) + 'deg)';
          }

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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="원경"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'custom', content: buildDorimPuppetHTML(), className: 'layer-dorim-wrap' },
          { type: 'custom', content: buildGaeroPuppetHTML(), className: 'layer-king-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT) {
          var dorim = slideEl.querySelector('.puppet-dorim');
          var dHead = slideEl.querySelector('.puppet-dorim .dorim-head');
          var dArm = slideEl.querySelector('.puppet-dorim .dorim-arm');
          var king = slideEl.querySelector('.puppet-gaero');
          var kHead = slideEl.querySelector('.puppet-gaero .gaero-head');

          // [은밀한 속삭임 모션: 도림이 왕 바로 앞까지 다가가 고개를 숙여 속삭이고 팔을 저음]
          if (dorim) {
            var whisperX = 30 + Math.min(1.0, p * 1.8) * 110;
            dorim.style.transform = 'translate3d(' + whisperX.toFixed(1) + 'px, 0, 0) scale(1.04)';
          }
          if (dHead) {
            var whisperTilt = 8.0 + Math.sin(globalT * 3.0) * 4.0; // 귓가로 고개를 바싹 기울임
            dHead.style.transform = 'rotate(' + whisperTilt.toFixed(2) + 'deg)';
          }
          if (dArm) {
            var whisperHand = Math.sin(globalT * 3.5) * 10.0;
            dArm.style.transform = 'rotate(' + whisperHand.toFixed(2) + 'deg)';
          }

          // 개로왕이 홀린 듯 수긍하며 고개를 끄덕임
          if (king) {
            var kingBack = -50 - p * 40;
            king.style.transform = 'translate3d(' + kingBack.toFixed(1) + 'px, 0, 0) scale(0.96)';
          }
          if (kHead) {
            var tranceNod = Math.sin(globalT * 3.2) * 6.0;
            kHead.style.transform = 'rotate(' + tranceNod.toFixed(2) + 'deg)';
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
          { type: 'image', src: 'assets/bg_goguryeo_march.jpg', alt: '고구려 성곽과 북풍', className: 'gaero-march-bg' },
          { type: 'custom', content: '<div class="gaero-cavalry-charge"><img src="assets/layer_cavalry.png" alt="고구려 철갑기병의 진격"></div>', className: 'layer-cavalry-wrap' },
          { type: 'custom', content: '<div class="gaero-dust-storm"></div>', className: 'layer-dust-wrap' },
          { type: 'custom', content: '<div class="gaero-crisis-tint"></div>', className: 'layer-crisis' },
          { type: 'custom', content: '<div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.gaero-march-bg');
          var cavalry = slideEl.querySelector('.gaero-cavalry-charge img');
          var dust = slideEl.querySelector('.gaero-dust-storm');
          var tint = slideEl.querySelector('.gaero-crisis-tint');
          var pines = slideEl.querySelector('.layer-pines');

          // 화면 전체를 뒤흔드는 전쟁 카메라 진동 (Earthquake shake)
          var shakeX = isPlaying ? Math.sin(globalT * 28.0) * 4.5 : 0;
          var shakeY = isPlaying ? Math.cos(globalT * 22.0) * 3.5 : 0;

          if (bg) {
            bg.style.transform = 'translate3d(' + (shakeX - p * 30).toFixed(1) + 'px, ' + shakeY.toFixed(1) + 'px, 0) scale(' + (1.05 + p * 0.1).toFixed(3) + ')';
          }

          if (cavalry) {
            var chargeX = 120 - p * 320;
            var chargeY = -40 + p * 80;
            var gallop = isPlaying ? Math.abs(Math.sin(globalT * 14.0)) * -14.0 : 0;
            cavalry.style.transform = 'translate3d(' + chargeX.toFixed(1) + 'px, ' + (chargeY + gallop).toFixed(1) + 'px, 0) scale(' + (1.0 + p * 0.25).toFixed(3) + ')';
          }

          if (dust) {
            dust.style.opacity = (Math.min(1.0, p * 2.0) * 0.75).toFixed(2);
            dust.style.transform = 'translate3d(' + (-p * 60).toFixed(1) + 'px, 0, 0)';
          }

          if (tint) tint.style.opacity = (0.35 + Math.sin(globalT * 4.5) * 0.3).toFixed(2);
          if (pines) pines.style.transform = 'translate3d(' + (-p * 50).toFixed(1) + 'px, 0, 0) scale(' + (1.04 + p * 0.08).toFixed(3) + ')';

          if (isPlaying && engine && engine.triggerOnce && p > 0.1) {
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
          { type: 'custom', content: '<div class="gaero-window-scenery"><img src="assets/layer_window_scenery.jpg" alt="노을 원경"></div>', className: 'layer-scenery-wrap' },
          { type: 'image', src: 'assets/layer_palace_frame.png', alt: '궁궐 기둥', className: 'gaero-palace-frame' },
          { type: 'custom', content: '<div class="s5-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<div class="gaero-board-wrap" style="left:38%;"><img src="assets/cutout_board.png" alt="혼자 남겨진 바둑판"></div>', className: 'layer-board-prop' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var scenery = slideEl.querySelector('.gaero-window-scenery img');
          var frame = slideEl.querySelector('.gaero-palace-frame');
          var beam = slideEl.querySelector('.s5-sunbeam');
          var boardProp = slideEl.querySelector('.gaero-board-wrap');
          var pines = slideEl.querySelector('.layer-pines');

          if (scenery) scenery.style.transform = 'scale(' + (1.02 + p * 0.08).toFixed(3) + ') translate3d(' + (-p * 20).toFixed(1) + 'px, 0, 0)';
          if (frame) frame.style.transform = 'scale(' + (1.04 + p * 0.06).toFixed(3) + ')';
          if (beam) beam.style.opacity = (0.25 + p * 0.6).toFixed(2);
          if (boardProp) {
            var boardScale = 1.0 + p * 0.22;
            boardProp.style.transform = 'scale(' + boardScale.toFixed(3) + ') translate3d(0, ' + (-p * 25).toFixed(1) + 'px, 0)';
          }
          if (pines) pines.style.transform = 'scale(' + (1.02 + p * 0.05).toFixed(3) + ')';

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
