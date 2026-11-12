/**
 * 종이 극장 이야기 (48초 8장 구성) — 우공이산 컨트롤러
 * 그림 위에는 어떤 글자나 버튼도 겹치지 않고, 하단 전용 극장 패널에 자막과 재생 바를 배치합니다.
 */
(function () {
  'use strict';

  var DURATION = 48.0; // 48초 분량

  var BEATS = [
    {
      start: 0,
      end: 6,
      chapter: '제1장 · 길을 막은 두 산',
      subtitle: '옛날 중국 북산에 아흔 살이 된 ‘우공’ 할아버지가 살았어요. 집 바로 앞을 거대한 태행산과 왕옥산 두 산이 가로막고 있어, 마을 사람들은 매일 먼 길을 빙 돌아가야 했지요.'
    },
    {
      start: 6,
      end: 12,
      chapter: '제2장 · 가족과의 결심',
      subtitle: '어느 날 우공은 온 가족을 불러 모아 말했어요. “우리가 힘을 합쳐 저 두 산을 깎아 평평한 길을 내자꾸나!” 식구들은 모두 기쁘게 고개를 끄덕였습니다.'
    },
    {
      start: 12,
      end: 18,
      chapter: '제3장 · 첫 삽을 뜨다',
      subtitle: '다음 날 아침, 우공과 자식·손자들은 삽과 삼태기를 들고 산기슭으로 나섰어요. 커다란 바위를 깨고 흙을 퍼 담아 저 멀리 바닷가까지 부지런히 날랐지요.'
    },
    {
      start: 18,
      end: 24,
      chapter: '제4장 · 이웃의 비웃음',
      subtitle: '그 모습을 본 이웃 노인 ‘지소’가 혀를 차며 웃었어요. “아흔 살 노인이 어찌 그 큰 산을 옮긴단 말이오? 흙 한 줌도 다 못 옮기고 기력이 다할 텐데요!”'
    },
    {
      start: 24,
      end: 30,
      chapter: '제5장 · 우공의 대답',
      subtitle: '우공은 땀을 닦으며 빙긋 웃고 답했어요. “내가 늙어 죽으면 아들이 있고, 아들이 죽으면 손자가, 또 그 자손이 대를 이어 계속할 걸세.”'
    },
    {
      start: 30,
      end: 36,
      chapter: '제6장 · 멈추지 않는 정성',
      subtitle: '“산은 더 자라지 않지만 우리 자손은 끝없이 이어지니, 언젠가는 반드시 산이 평지가 되지 않겠소?” 지소는 그 말에 아무 대답도 하지 못했어요.'
    },
    {
      start: 36,
      end: 42,
      chapter: '제7장 · 하늘의 감동',
      subtitle: '비가 오나 바람이 부나 하루도 쉬지 않는 우공 가족의 끈기를 하늘의 신이 굽어보고 크게 감동했어요. 저 거대한 산 너머로 따스한 아침 해가 비추기 시작했지요.'
    },
    {
      start: 42,
      end: 48.1,
      chapter: '제8장 · 산이 움직이다',
      subtitle: '마침내 하늘의 신이 힘센 신령들을 보내 두 산을 번쩍 들어 다른 곳으로 옮겨 주었답니다. 포기하지 않는 꾸준함이 거대한 산도 움직인 거예요!'
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
    var pct = Math.min(100, Math.max(0, (t / DURATION) * 100));
    progressFill.style.width = pct.toFixed(2) + '%';
    progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
    timePill.textContent = formatSec(t) + ' / ' + formatSec(DURATION);

    for (var i = 0; i < BEATS.length; i++) {
      if (t >= BEATS[i].start && t < BEATS[i].end) {
        stageChapter.textContent = BEATS[i].chapter;
        shortsSubtitle.textContent = BEATS[i].subtitle;
        break;
      }
    }

    // Mountains slowly sink between 12s (when digging starts) and 42s
    var mtnProgress = 0;
    if (t > 12) {
      mtnProgress = Math.min(1, (t - 12) / 30);
    }
    var eased = mtnProgress * mtnProgress * (3 - 2 * mtnProgress);
    var mtnDropPx = eased * 185;
    layerMountains.style.transform = 'translateY(' + mtnDropPx.toFixed(1) + 'px)';

    // Subtle digging bob for Ugong during working chapters (12s ~ 36s)
    var digBob = 0;
    if (t >= 12 && t <= 36 && playing) {
      digBob = Math.abs(Math.sin(t * 3.4)) * -3.2;
    }
    layerVillage.style.transform = 'translateY(' + digBob.toFixed(2) + 'px)';

    // Blossoms appear in the finale (40s+)
    particlesLayer.classList.toggle('blossoms', t >= 40);
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
