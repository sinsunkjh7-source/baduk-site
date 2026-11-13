/**
 * Paper Theater Story Data: 난가대국 (爛柯對局)
 * ===============================================
 * - 모든 장면에 실제 분리된 Z-깊이 다층 레이어(배경/안개/인물 컷아웃/살아 움직이는 바둑판/소나무 프레임) 적용
 * - Web Audio API 오음계 BGM 및 바둑돌 착수음('stone')·신비음('chime')·부스러기('crumble') 효과음 연동
 * - 설정 일관성 100%: 1~3장은 도끼를 가진 나무꾼, 5~6장은 삭은 도끼, 7~8장은 빈손(도끼 없음)의 놀란 나무꾼
 */

(function () {
  var STONE_COORDS = [
    { x: 22, y: 26, c: 'black' },
    { x: 76, y: 28, c: 'white' },
    { x: 26, y: 74, c: 'black' },
    { x: 74, y: 72, c: 'white' },
    { x: 50, y: 48, c: 'black' },
    { x: 36, y: 38, c: 'white' },
    { x: 64, y: 36, c: 'black' },
    { x: 38, y: 62, c: 'white' },
    { x: 60, y: 60, c: 'black' }
  ];

  function buildLiveBoardHTML() {
    var html = '<div class="nanga-live-board">';
    for (var i = 0; i < STONE_COORDS.length; i++) {
      var s = STONE_COORDS[i];
      html += '<span class="nanga-stone ' + s.c + '" data-stone-idx="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%;"></span>';
    }
    html += '</div>';
    return html;
  }

  function updateLiveBoard(slideEl, p, baseCount, addCount, isPlaying, engine, sfxPrefix) {
    var board = slideEl.querySelector('.nanga-live-board');
    if (!board) return;
    var stones = board.querySelectorAll('.nanga-stone');
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

  window.STORY_NANGA = {
    id: 'nanga',
    title: '난가대국',
    hanja: '爛柯對局',
    badge: '🎬 다층 종이 극장 · 바둑 전설',
    summary: '신선들의 바둑을 구경하느라 도끼자루가 썩는 줄도 몰랐다는 신비로운 바둑 이야기',
    duration: 71.4,

    scenes: [
      {
        id: 'nanga_s1',
        start: 0,
        end: 8.1,
        chapter: '제1장 · 깊은 산속으로',
        subtitle: '옛날 한 나무꾼이 도끼를 메고, 깊고 깊은 산속으로 나무를 하러 들어갔어요.',
        audio: 'assets/nanga_s1.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '먼 산속 하늘', className: 'layer-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '숲 너머 왼쪽 원산', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '숲 너머 오른쪽 원산', className: 'layer-mountains layer-mtn-r' },
          { type: 'image', src: 'assets/layer_forest_mid.png', alt: '깊은 소나무 숲길 중경', className: 'nanga-layer-full layer-forest-mid' },
          { type: 'custom', content: '<div class="s5-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'custom', content: '<img src="assets/cutout_woodcutter.png" alt="도끼를 메고 산으로 들어가는 나무꾼" class="nanga-woodcutter-sprite" draggable="false">', className: 'layer-woodcutter-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var forest = slideEl.querySelector('.layer-forest-mid');
          var beam = slideEl.querySelector('.s5-sunbeam');
          var sprite = slideEl.querySelector('.nanga-woodcutter-sprite');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translate3d(' + (p * 18).toFixed(1) + 'px, 0, 0) scale(1.06)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-p * 24).toFixed(1) + 'px, 10px, 0) scale(1.04)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (p * 24).toFixed(1) + 'px, 10px, 0) scale(1.04)';
          if (forest) forest.style.transform = 'scale(' + (1.02 + p * 0.06).toFixed(3) + ') translate3d(' + (-p * 28).toFixed(1) + 'px, 0, 0)';
          if (beam) beam.style.opacity = (0.35 + Math.sin(globalT * 1.4) * 0.12).toFixed(2);
          if (sprite) {
            var walkX = p * 185;
            var walkY = -p * 24;
            var walkScale = 0.96 - p * 0.2;
            var bob = isPlaying ? Math.abs(Math.sin(globalT * 5.2)) * -5.5 : 0;
            var tilt = isPlaying ? Math.sin(globalT * 2.6) * 1.6 : 0;
            sprite.style.transform = 'translate3d(' + walkX.toFixed(1) + 'px, ' + (walkY + bob).toFixed(1) + 'px, 0) scale(' + walkScale.toFixed(3) + ') rotate(' + tilt.toFixed(2) + 'deg)';
          }
          if (pines) pines.style.transform = 'translate3d(' + (-p * 46).toFixed(1) + 'px, 0, 0) scale(' + (1.04 + p * 0.08).toFixed(3) + ')';
          if (isPlaying && engine && engine.triggerOnce && p > 0.08) {
            engine.triggerOnce('s1_chime', function () { engine.playSFX('chime'); });
          }
        }
      },
      {
        id: 'nanga_s2',
        start: 8.1,
        end: 16.2,
        chapter: '제2장 · 신선들의 바둑',
        subtitle: '숲속 깊은 바위 쉼터에서, 두 동자가 마주 앉아 조용히 바둑을 두고 있었지요.',
        audio: 'assets/nanga_s2.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '신비로운 산속 하늘', className: 'layer-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '왼쪽 겹산', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '오른쪽 겹산', className: 'layer-mountains layer-mtn-r' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_clearing_ledge.png', alt: '이끼 바위 쉼터 중경', className: 'nanga-layer-full layer-clearing-mid' },
          { type: 'custom', content: '<img src="assets/cutout_immortals.png" alt="바위 위에서 바둑을 두는 두 동자" class="nanga-immortals-sprite" draggable="false">', className: 'layer-immortals-wrap' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-board-wrap' },
          { type: 'custom', content: '<div class="nanga-board-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var clearing = slideEl.querySelector('.layer-clearing-mid');
          var imm = slideEl.querySelector('.nanga-immortals-sprite');
          var glow = slideEl.querySelector('.nanga-board-glow');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translateX(' + (-p * 20).toFixed(1) + 'px) scale(1.08)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-p * 32).toFixed(1) + 'px, 8px, 0) scale(1.05)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (p * 32).toFixed(1) + 'px, 8px, 0) scale(1.05)';
          if (clearing) clearing.style.transform = 'translate3d(' + (-p * 18).toFixed(1) + 'px, 0, 0) scale(' + (1.03 + p * 0.03).toFixed(3) + ')';
          if (imm) {
            var breathe = Math.sin(globalT * 1.8) * 1.8;
            imm.style.transform = 'translate3d(' + (-p * 14).toFixed(1) + 'px, ' + breathe.toFixed(1) + 'px, 0) scale(' + (0.98 + p * 0.04).toFixed(3) + ')';
          }
          if (glow) glow.style.opacity = (0.45 + Math.sin(globalT * 2.2) * 0.25).toFixed(2);
          if (pines) pines.style.transform = 'translate3d(' + (p * 36).toFixed(1) + 'px, 0, 0) scale(' + (1.03 + p * 0.05).toFixed(3) + ')';

          updateLiveBoard(slideEl, p, 0, 3, isPlaying, engine, 's2');
          if (isPlaying && engine && engine.triggerOnce && p > 0.12) {
            engine.triggerOnce('s2_chime', function () { engine.playSFX('chime'); });
          }
        }
      },
      {
        id: 'nanga_s3',
        start: 16.2,
        end: 25.0,
        chapter: '제3장 · 넋을 잃고 빠져들다',
        subtitle: '나무꾼은 도끼를 바닥에 내려놓고, 신비로운 바둑 대국에 넋을 잃고 빠져들었습니다.',
        audio: 'assets/nanga_s3.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '산속 하늘', className: 'layer-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '왼쪽 겹산', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '오른쪽 겹산', className: 'layer-mountains layer-mtn-r' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_clearing_ledge.png', alt: '이끼 바위 쉼터 중경', className: 'nanga-layer-full layer-clearing-mid' },
          { type: 'custom', content: '<img src="assets/cutout_immortals.png" alt="바둑을 두는 두 동자" class="nanga-immortals-sprite" draggable="false">', className: 'layer-immortals-wrap' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-board-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_watcher.png" alt="도끼를 내려놓고 구경하는 나무꾼" class="nanga-watcher-sprite" draggable="false">', className: 'layer-watcher-wrap' },
          { type: 'custom', content: '<div class="nanga-board-glow"></div>', className: 'layer-glow-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var clearing = slideEl.querySelector('.layer-clearing-mid');
          var imm = slideEl.querySelector('.nanga-immortals-sprite');
          var watcher = slideEl.querySelector('.nanga-watcher-sprite');
          var glow = slideEl.querySelector('.nanga-board-glow');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translateX(' + (-16 - p * 18).toFixed(1) + 'px) scale(1.08)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-20 - p * 24).toFixed(1) + 'px, 10px, 0) scale(1.05)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (20 + p * 24).toFixed(1) + 'px, 10px, 0) scale(1.05)';
          if (clearing) clearing.style.transform = 'translate3d(' + (-14 - p * 14).toFixed(1) + 'px, 0, 0) scale(1.05)';
          if (imm) {
            var breathe = Math.sin(globalT * 2.0) * 1.5;
            imm.style.transform = 'translate3d(-10px, ' + breathe.toFixed(1) + 'px, 0) scale(' + (1.01 + p * 0.03).toFixed(3) + ')';
          }
          if (watcher) {
            var lean = p * 2.4;
            watcher.style.transform = 'translate3d(' + (p * 36).toFixed(1) + 'px, 0, 0) scale(' + (0.94 + p * 0.05).toFixed(3) + ') rotate(' + lean.toFixed(2) + 'deg)';
          }
          if (glow) glow.style.opacity = (0.55 + Math.sin(globalT * 2.8) * 0.3).toFixed(2);
          if (pines) pines.style.transform = 'translate3d(' + (-p * 32).toFixed(1) + 'px, 0, 0) scale(' + (1.04 + p * 0.05).toFixed(3) + ')';

          updateLiveBoard(slideEl, p, 3, 3, isPlaying, engine, 's3');
        }
      },
      {
        id: 'nanga_s4',
        start: 25.0,
        end: 35.2,
        chapter: '제4장 · 빠르게 흐르는 사계절',
        subtitle: '바둑돌이 딸깍 놓일 때마다, 산속의 시간은 봄, 여름, 가을, 겨울로 빠르게 흘러갔어요.',
        audio: 'assets/nanga_s4.mp3',
        particlesClass: 'blossoms',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '흐르는 사계절 하늘', className: 'layer-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '왼쪽 겹산', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '오른쪽 겹산', className: 'layer-mountains layer-mtn-r' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_clearing_ledge.png', alt: '사계절 이끼 바위 쉼터', className: 'nanga-layer-full layer-clearing-mid' },
          { type: 'custom', content: '<img src="assets/cutout_immortals.png" alt="바둑을 두는 동자들" class="nanga-immortals-sprite" draggable="false">', className: 'layer-immortals-wrap' },
          { type: 'custom', content: buildLiveBoardHTML(), className: 'layer-board-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_watcher.png" alt="시간 가는 줄 모르고 구경하는 나무꾼" class="nanga-watcher-sprite" draggable="false">', className: 'layer-watcher-wrap' },
          { type: 'custom', content: '<div class="nanga-season-tint"></div>', className: 'layer-season-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' },
          { type: 'custom', content: '<div class="nanga-season-badge">🌸 봄 · 꽃이 피고</div>', className: 'layer-season-badge-wrap' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var clearing = slideEl.querySelector('.layer-clearing-mid');
          var imm = slideEl.querySelector('.nanga-immortals-sprite');
          var watcher = slideEl.querySelector('.nanga-watcher-sprite');
          var pines = slideEl.querySelector('.layer-pines');
          var tint = slideEl.querySelector('.nanga-season-tint');
          var badge = slideEl.querySelector('.nanga-season-badge');
          var particles = document.querySelector('[data-ref="particles"]');

          if (sky) sky.style.transform = 'translateX(' + (-p * 48).toFixed(1) + 'px) scale(1.12)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-p * 34).toFixed(1) + 'px, 12px, 0) scale(1.06)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (p * 34).toFixed(1) + 'px, 12px, 0) scale(1.06)';
          if (clearing) clearing.style.transform = 'translate3d(' + (-p * 16).toFixed(1) + 'px, 0, 0) scale(1.05)';
          if (imm) imm.style.transform = 'translate3d(-10px, ' + (Math.sin(globalT * 2.2) * 1.5).toFixed(1) + 'px, 0) scale(1.03)';
          if (watcher) watcher.style.transform = 'translate3d(28px, 0, 0) scale(0.98) rotate(2deg)';
          if (pines && isPlaying) {
            var sway = Math.sin(globalT * 2.4) * 9;
            pines.style.transform = 'translateX(' + sway.toFixed(1) + 'px) scale(1.04)';
          }

          var seasonFilter = 'none';
          if (p < 0.25) {
            if (tint) tint.style.background = 'rgba(255, 192, 215, 0.24)';
            seasonFilter = 'saturate(1.08) brightness(1.02)';
            if (badge) badge.textContent = '🌸 봄 · 꽃이 피고';
            if (particles) particles.className = 'pt-depth-layer layer-particles blossoms';
          } else if (p < 0.5) {
            if (tint) tint.style.background = 'rgba(74, 222, 128, 0.20)';
            seasonFilter = 'saturate(1.18) hue-rotate(-6deg)';
            if (badge) badge.textContent = '🌿 여름 · 녹음이 짙어지고';
            if (particles) particles.className = 'pt-depth-layer layer-particles mystic';
          } else if (p < 0.75) {
            if (tint) tint.style.background = 'rgba(249, 115, 22, 0.28)';
            seasonFilter = 'sepia(0.28) saturate(1.25)';
            if (badge) badge.textContent = '🍁 가을 · 단풍이 물들며';
            if (particles) particles.className = 'pt-depth-layer layer-particles autumn';
          } else {
            if (tint) tint.style.background = 'rgba(186, 230, 253, 0.34)';
            seasonFilter = 'saturate(0.75) brightness(1.06)';
            if (badge) badge.textContent = '❄️ 겨울 · 흰 눈이 내리고';
            if (particles) particles.className = 'pt-depth-layer layer-particles winter';
          }
          if (sky) sky.style.filter = seasonFilter;
          if (clearing) clearing.style.filter = seasonFilter;

          updateLiveBoard(slideEl, p, 6, 3, isPlaying, engine, 's4');
        }
      },
      {
        id: 'nanga_s5',
        start: 35.2,
        end: 44.2,
        chapter: '제5장 · 동자의 한마디',
        subtitle: '한참 뒤 동자가 말했지요. “그대의 도끼자루가 이미 다 썩어 없어졌구려.”',
        audio: 'assets/nanga_s5.mp3',
        particlesClass: 'autumn',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '산속 하늘', className: 'layer-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '왼쪽 겹산', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '오른쪽 겹산', className: 'layer-mountains layer-mtn-r' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_clearing_ledge.png', alt: '이끼 바위 쉼터', className: 'nanga-layer-full layer-clearing-mid' },
          { type: 'custom', content: '<img src="assets/cutout_immortals.png" alt="동자의 말" class="nanga-immortals-sprite" draggable="false">', className: 'layer-immortals-wrap' },
          { type: 'custom', content: '<img src="assets/cutout_watcher.png" alt="놀라는 나무꾼" class="nanga-watcher-sprite" draggable="false">', className: 'layer-watcher-wrap' },
          { type: 'custom', content: '<div class="nanga-dust-puff"></div><img src="assets/cutout_axe.png" alt="썩어가는 도끼자루" class="nanga-axe-sprite" draggable="false">', className: 'layer-axe-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var clearing = slideEl.querySelector('.layer-clearing-mid');
          var imm = slideEl.querySelector('.nanga-immortals-sprite');
          var watcher = slideEl.querySelector('.nanga-watcher-sprite');
          var axe = slideEl.querySelector('.nanga-axe-sprite');
          var dust = slideEl.querySelector('.nanga-dust-puff');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translateX(' + (p * 16).toFixed(1) + 'px) scale(1.08)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-p * 22).toFixed(1) + 'px, 10px, 0) scale(1.05)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (p * 22).toFixed(1) + 'px, 10px, 0) scale(1.05)';
          if (clearing) clearing.style.transform = 'translate3d(' + (p * 12).toFixed(1) + 'px, 0, 0) scale(1.04)';
          if (imm) imm.style.transform = 'translate3d(0, ' + (-p * 14).toFixed(1) + 'px, 0) scale(0.96)';
          if (watcher) watcher.style.transform = 'translate3d(' + (-p * 18).toFixed(1) + 'px, 0, 0) scale(0.96) rotate(' + (-p * 2.2).toFixed(2) + 'deg)';
          if (axe) {
            var op = Math.min(1, p * 2.2);
            var y = (1 - Math.min(1, p * 1.4)) * 34;
            axe.style.opacity = op.toFixed(2);
            axe.style.transform = 'translate3d(0, ' + y.toFixed(1) + 'px, 0) scale(' + (0.85 + p * 0.18).toFixed(3) + ')';
          }
          if (dust) {
            dust.style.opacity = (Math.sin(Math.min(1, p * 1.4) * Math.PI) * 0.85).toFixed(2);
            dust.style.transform = 'scale(' + (0.9 + p * 0.35).toFixed(2) + ')';
          }
          if (pines) pines.style.transform = 'translate3d(' + (-p * 28).toFixed(1) + 'px, 0, 0) scale(1.04)';
          if (isPlaying && engine && engine.triggerOnce && p > 0.25) {
            engine.triggerOnce('s5_crumble', function () { engine.playSFX('crumble'); });
          }
        }
      },
      {
        id: 'nanga_s6',
        start: 44.2,
        end: 53.6,
        chapter: '제6장 · 삭아버린 도끼자루',
        subtitle: '깜짝 놀라 발밑을 보니, 단단했던 나무 자루는 삭아 흙이 되고 쇠도끼만 뒹굴고 있었어요.',
        audio: 'assets/nanga_s6.mp3',
        particlesClass: 'autumn',
        layers: [
          { type: 'image', src: 'assets/scene6_axe.jpg', alt: '이끼 속에 삭아버린 도끼자루', className: 'slide-base-img' },
          { type: 'custom', content: '<div class="nanga-dust-puff"></div>', className: 'layer-dust-wrap' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var bg = slideEl.querySelector('.slide-base-img img');
          var pines = slideEl.querySelector('.layer-pines');
          var dust = slideEl.querySelector('.nanga-dust-puff');
          if (bg) bg.style.transform = 'scale(' + (1.02 + p * 0.08).toFixed(3) + ') translate3d(' + (-p * 16).toFixed(1) + 'px, ' + (-p * 8).toFixed(1) + 'px, 0)';
          if (pines) pines.style.transform = 'translate3d(' + (p * 34).toFixed(1) + 'px, 0, 0) scale(' + (1.03 + p * 0.09).toFixed(3) + ')';
          if (dust) dust.style.opacity = (0.35 + Math.sin(p * Math.PI) * 0.4).toFixed(2);
          if (isPlaying && engine && engine.triggerOnce && p > 0.15) {
            engine.triggerOnce('s6_crumble', function () { engine.playSFX('crumble'); });
          }
        }
      },
      {
        id: 'nanga_s7',
        start: 53.6,
        end: 63.0,
        chapter: '제7장 · 변해버린 마을',
        subtitle: '서둘러 마을로 내려왔지만, 낯선 사람들뿐이고 이미 수백 년의 세월이 흘러간 뒤였답니다.',
        audio: 'assets/nanga_s7.mp3',
        particlesClass: 'mystic',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '노을 지는 하늘', className: 'layer-sky nanga-sunset-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '먼 왼쪽 산맥', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '먼 오른쪽 산맥', className: 'layer-mountains layer-mtn-r' },
          { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
          { type: 'image', src: 'assets/layer_village_mid.png', alt: '수백 년이 흘러 변해버린 마을 중경', className: 'nanga-layer-full layer-village-mid' },
          { type: 'custom', content: '<img src="assets/cutout_woodcutter_noaxe.png" alt="빈손으로 마을을 향해 내려오는 나무꾼 왕질" class="nanga-woodcutter-noaxe-sprite" draggable="false">', className: 'layer-woodcutter-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var village = slideEl.querySelector('.layer-village-mid');
          var sprite = slideEl.querySelector('.nanga-woodcutter-noaxe-sprite');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translateX(' + (p * 18).toFixed(1) + 'px) scale(1.08)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-p * 28).toFixed(1) + 'px, -4px, 0) scale(1.05)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (p * 28).toFixed(1) + 'px, -4px, 0) scale(1.05)';
          if (village) village.style.transform = 'translate3d(' + (p * 24).toFixed(1) + 'px, 0, 0) scale(' + (1.05 - p * 0.03).toFixed(3) + ')';
          if (sprite) {
            // Cutout faces LEFT, so move from right hill (-X toward left village, +Y downhill) -> natural forward walking!
            var walkX = -p * 145;
            var walkY = p * 26;
            var bob = isPlaying ? Math.abs(Math.sin(globalT * 4.8)) * -4.0 : 0;
            var tilt = isPlaying ? Math.sin(globalT * 2.4) * 1.5 : 0;
            sprite.style.transform = 'translate3d(' + walkX.toFixed(1) + 'px, ' + (walkY + bob).toFixed(1) + 'px, 0) scale(' + (0.92 + p * 0.08).toFixed(3) + ') rotate(' + tilt.toFixed(2) + 'deg)';
          }
          if (pines) pines.style.transform = 'translate3d(' + (p * 46).toFixed(1) + 'px, 0, 0) scale(' + (1.06 - p * 0.04).toFixed(3) + ')';
        }
      },
      {
        id: 'nanga_s8',
        start: 63.0,
        end: 71.4,
        chapter: '제8장 · 시간마저 잊는 바둑의 묘미',
        subtitle: '이처럼 바둑의 깊은 묘미는, 시간마저 잊게 할 만큼 아름답고 신비롭답니다.',
        audio: 'assets/nanga_s8.mp3',
        particlesClass: 'blossoms',
        layers: [
          { type: 'image', src: 'assets/layer_sky.jpg', alt: '아름다운 노을 하늘', className: 'layer-sky nanga-sunset-sky' },
          { type: 'image', src: 'assets/layer_mtn_left.png', alt: '노을빛 왼쪽 산맥', className: 'layer-mountains layer-mtn-l' },
          { type: 'image', src: 'assets/layer_mtn_right.png', alt: '노을빛 오른쪽 산맥', className: 'layer-mountains layer-mtn-r' },
          { type: 'image', src: 'assets/layer_village_mid.png', alt: '평화로운 마을 중경', className: 'nanga-layer-full layer-village-mid' },
          { type: 'custom', content: '<div class="s5-sunbeam"></div>', className: 'layer-sunbeam' },
          { type: 'custom', content: '<img src="assets/cutout_woodcutter_noaxe.png" alt="노을 아래 마을을 바라보는 빈손의 나무꾼" class="nanga-woodcutter-noaxe-sprite" draggable="false">', className: 'layer-woodcutter-wrap' },
          { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
        ],
        animate: function (slideEl, p, localT, globalT, isPlaying, engine) {
          var sky = slideEl.querySelector('.layer-sky');
          var mtnL = slideEl.querySelector('.layer-mtn-l');
          var mtnR = slideEl.querySelector('.layer-mtn-r');
          var village = slideEl.querySelector('.layer-village-mid');
          var beam = slideEl.querySelector('.s5-sunbeam');
          var sprite = slideEl.querySelector('.nanga-woodcutter-noaxe-sprite');
          var pines = slideEl.querySelector('.layer-pines');

          if (sky) sky.style.transform = 'translateX(' + (18 - p * 16).toFixed(1) + 'px) scale(1.08)';
          if (mtnL) mtnL.style.transform = 'translate3d(' + (-24 - p * 18).toFixed(1) + 'px, -4px, 0) scale(1.05)';
          if (mtnR) mtnR.style.transform = 'translate3d(' + (24 + p * 18).toFixed(1) + 'px, -4px, 0) scale(1.05)';
          if (village) village.style.transform = 'translate3d(' + (20 - p * 16).toFixed(1) + 'px, 0, 0) scale(' + (1.02 + p * 0.04).toFixed(3) + ')';
          if (beam) beam.style.opacity = (0.35 + p * 0.5).toFixed(2);
          if (sprite) sprite.style.transform = 'translate3d(-145px, ' + (26 + Math.sin(globalT * 1.5) * 1.5).toFixed(1) + 'px, 0) scale(' + (1.0 - p * 0.03).toFixed(3) + ')';
          if (pines) pines.style.transform = 'translate3d(' + (42 - p * 32).toFixed(1) + 'px, 0, 0) scale(' + (1.02 + p * 0.05).toFixed(3) + ')';
          if (isPlaying && engine && engine.triggerOnce && p > 0.15) {
            engine.triggerOnce('s8_chime', function () { engine.playSFX('chime'); });
          }
        }
      }
    ],

  study: {
    hanja: [
      { char: '爛', meaning: '썩을 란' },
      { char: '柯', meaning: '도끼자루 가' },
      { char: '對', meaning: '마주할 대' },
      { char: '局', meaning: '판 국' }
    ],
    badukWisdom: '‘난가(爛柯)’는 도끼자루가 썩는 줄도 모르고 빠져들 만큼 재미있고 깊은 ‘바둑’을 뜻하는 또 다른 이름이랍니다. 한 수 한 수 깊이 생각하며 집중하는 즐거움을 느껴보세요!',
    quiz: {
      question: '옛날부터 바둑을 ‘난가(爛柯)’라고 부르게 된 이유는 무엇일까요?',
      options: [
        { text: '도끼로 바둑판을 만들어서', correct: false },
        { text: '바둑 구경에 푹 빠져 도끼자루가 썩는 줄 몰라서', correct: true },
        { text: '도끼를 팔아 바둑돌을 사서', correct: false }
      ],
      correctMsg: '🎉 정답입니다! 바둑에 깊이 몰입하면 시간 가는 줄도 모른다는 뜻에서 바둑을 ‘난가’라고 부르게 되었어요.',
      wrongMsg: '나무꾼 왕질의 손에 들려 있던 도끼에 어떤 일이 일어났는지 떠올려 보세요!'
    }
  }
  };
})();
