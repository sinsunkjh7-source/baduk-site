/**
 * 종이 극장 쇼츠 (24초 연속 재생) — 우공이산 컨트롤러
 * 무대 전체를 흔들지 않고, 이야기 흐름에 따라 필요한 요소(안개·소나무 바람·우공 삽질·산 이동·꽃잎)만 자연스럽게 움직입니다.
 */
(function () {
  'use strict';

  var DURATION = 24.0; // seconds

  var BEATS = [
    {
      start: 0,
      end: 6,
      chapter: '제1장 · 거대한 산',
      subtitle: '옛날 아흔 살 우공 할아버지 집 앞에는 너무 큰 두 산이 가로막고 있었어요.'
    },
    {
      start: 6,
      end: 12,
      chapter: '제2장 · 매일 한 삽씩',
      subtitle: '“내가 못 끝내면 자식이, 또 손자가 계속 옮기면 언젠간 평지가 될 걸세!”'
    },
    {
      start: 12,
      end: 18,
      chapter: '제3장 · 움직이는 산',
      subtitle: '우공은 하루도 쉬지 않고 묵묵히 흙을 날랐고, 산은 조금씩 낮아지기 시작했어요.'
    },
    {
      start: 18,
      end: 24.1,
      chapter: '제4장 · 하늘의 감동',
      subtitle: '우공의 지치지 않는 끈기에 하늘도 감동해 산을 옮겨 주었답니다. 꾸준함이 산도 움직여요!'
    }
  ];

  var layerMountains = document.getElementById('layerMountains');
  var layerVillage = document.getElementById('layerVillage');
  var particlesLayer = document.getElementById('particlesLayer');

  var timePill = document.getElementById('timePill');
  var stageChapter = document.getElementById('stageChapter');
  var shortsSubtitle = document.getElementById('shortsSubtitle');
  var btnPlayPause = document.getElementById('btnPlayPause');
  var btnReplay = document.getElementById('btnReplay');
  var progressTrack = document.getElementById('progressTrack');
  var progressFill = document.getElementById('progressFill');

  var quizOpts = document.querySelectorAll('.quiz-opt');
  var quizResult = document.getElementById('quizResult');

  var elapsed = 0;
  var playing = true;
  var lastTime = performance.now();

  function formatSec(sec) {
    var s = Math.min(Math.floor(sec), Math.floor(DURATION));
    return '00:' + (s < 10 ? '0' + s : String(s));
  }

  function updateVisuals(t) {
    // 1. Update progress bar & time pill
    var pct = Math.min(100, Math.max(0, (t / DURATION) * 100));
    progressFill.style.width = pct.toFixed(2) + '%';
    progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
    timePill.textContent = formatSec(t) + ' / ' + formatSec(DURATION);

    // 2. Active subtitle beat
    for (var i = 0; i < BEATS.length; i++) {
      if (t >= BEATS[i].start && t < BEATS[i].end) {
        stageChapter.textContent = BEATS[i].chapter;
        shortsSubtitle.textContent = BEATS[i].subtitle;
        break;
      }
    }

    // 3. Only move the elements that should move:
    //    - Mountains smoothly sink between 6s and 20s (revealing sunrise sky behind)
    var mtnProgress = 0;
    if (t > 6) {
      mtnProgress = Math.min(1, (t - 6) / 14);
    }
    // Ease in-out
    var eased = mtnProgress * mtnProgress * (3 - 2 * mtnProgress);
    var mtnDropPx = eased * 175;
    layerMountains.style.transform = 'translateY(' + mtnDropPx.toFixed(1) + 'px)';

    //    - Ugong & village foreground subtly bobs ONLY during digging phase (6s ~ 18s)
    var digBob = 0;
    if (t >= 6 && t <= 18 && playing) {
      digBob = Math.abs(Math.sin(t * 3.8)) * -3.5;
    }
    layerVillage.style.transform = 'translateY(' + digBob.toFixed(2) + 'px)';

    //    - Blossoms appear in the finale (18s+)
    particlesLayer.classList.toggle('blossoms', t >= 18);
  }

  function tick(now) {
    var dt = Math.min(0.1, (now - lastTime) * 0.001);
    lastTime = now;

    if (playing) {
      elapsed += dt;
      if (elapsed >= DURATION) {
        elapsed = DURATION;
        playing = false;
        btnPlayPause.textContent = '▶️ 다시 재생';
      }
    }

    updateVisuals(elapsed);
    requestAnimationFrame(tick);
  }

  btnPlayPause.addEventListener('click', function () {
    if (elapsed >= DURATION) {
      elapsed = 0;
      playing = true;
      btnPlayPause.textContent = '⏸️ 일시정지';
      return;
    }
    playing = !playing;
    btnPlayPause.textContent = playing ? '⏸️ 일시정지' : '▶️ 재생';
  });

  btnReplay.addEventListener('click', function () {
    elapsed = 0;
    playing = true;
    btnPlayPause.textContent = '⏸️ 일시정지';
    updateVisuals(0);
  });

  progressTrack.addEventListener('click', function (e) {
    var rect = progressTrack.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    elapsed = ratio * DURATION;
    updateVisuals(elapsed);
  });

  quizOpts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ok = btn.getAttribute('data-ok') === 'true';
      quizOpts.forEach(function (b) {
        b.classList.remove('correct', 'wrong');
      });
      btn.classList.add(ok ? 'correct' : 'wrong');
      quizResult.hidden = false;
      quizResult.textContent = ok
        ? '🎉 정답입니다! 어렵더라도 포기하지 않고 꾸준히 노력하는 마음이 바로 우공이산이에요.'
        : '다시 한 번 생각해 볼까요? 우공 할아버지가 산을 옮긴 비결을 떠올려 보세요!';
    });
  });

  updateVisuals(0);
  requestAnimationFrame(tick);
})();
