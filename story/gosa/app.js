/**
 * 다층 종이 극장 쇼츠 (48초 8장 · 매 장면 레이어 분리 입체 움직임) — 우공이산 컨트롤러
 */
(function () {
  'use strict';

  var DURATION = 48.0;

  var BEATS = [
    {
      start: 0,
      end: 6,
      slide: 0,
      chapter: '제1장 · 길을 막은 두 산',
      subtitle: '옛날 중국 북산에 아흔 살이 된 ‘우공’ 할아버지가 살았어요. 집 바로 앞을 거대한 태행산과 왕옥산 두 산이 가로막고 있어, 마을 사람들은 매일 먼 길을 빙 돌아가야 했지요.'
    },
    {
      start: 6,
      end: 12,
      slide: 1,
      chapter: '제2장 · 가족과의 결심',
      subtitle: '어느 날 우공은 온 가족을 불러 모아 말했어요. “우리가 힘을 합쳐 저 두 산을 깎아 평평한 길을 내자꾸나!” 식구들은 모두 기쁘게 고개를 끄덕였습니다.'
    },
    {
      start: 12,
      end: 18,
      slide: 2,
      chapter: '제3장 · 첫 삽을 뜨다',
      subtitle: '다음 날 아침, 우공과 자식·손자들은 삽과 삼태기를 들고 산기슭으로 나섰어요. 커다란 바위를 깨고 흙을 퍼 담아 저 멀리 바닷가까지 부지런히 날랐지요.'
    },
    {
      start: 18,
      end: 24,
      slide: 3,
      chapter: '제4장 · 이웃의 비웃음',
      subtitle: '그 모습을 본 이웃 노인 ‘지소’가 혀를 차며 웃었어요. “아흔 살 노인이 어찌 그 큰 산을 옮긴단 말이오? 흙 한 줌도 다 못 옮기고 기력이 다할 텐데요!”'
    },
    {
      start: 24,
      end: 30,
      slide: 4,
      chapter: '제5장 · 우공의 대답',
      subtitle: '우공은 땀을 닦으며 빙긋 웃고 답했어요. “내가 늙어 죽으면 아들이 있고, 아들이 죽으면 손자가, 또 그 자손이 대를 이어 계속할 걸세.”'
    },
    {
      start: 30,
      end: 36,
      slide: 4,
      chapter: '제6장 · 낮아지는 산',
      subtitle: '“산은 더 자라지 않지만 우리 자손은 끝없이 이어지니, 언젠가는 반드시 산이 평지가 되지 않겠소?” 그 끈기에 거대한 산도 조금씩 낮아지기 시작했어요.'
    },
    {
      start: 36,
      end: 42,
      slide: 5,
      chapter: '제7장 · 하늘의 감동',
      subtitle: '비가 오나 바람이 부나 하루도 쉬지 않는 우공 가족의 정성을, 하늘의 신(천제)이 굽어보고 크게 감동해 힘센 신령들을 내려보냈지요.'
    },
    {
      start: 42,
      end: 48.1,
      slide: 6,
      chapter: '제8장 · 산이 움직이다',
      subtitle: '마침내 신령들이 두 산을 번쩍 들어 다른 곳으로 옮겨 주었답니다. 포기하지 않는 꾸준함이 거대한 산도 움직인 거예요!'
    }
  ];

  var slides = [
    document.getElementById('slide0'),
    document.getElementById('slide1'),
    document.getElementById('slide2'),
    document.getElementById('slide3'),
    document.getElementById('slide4'),
    document.getElementById('slide5'),
    document.getElementById('slide6')
  ];

  var s0MtnL = document.getElementById('s0MtnL');
  var s0MtnR = document.getElementById('s0MtnR');
  var s2Sky = document.getElementById('s2Sky');
  var s2Mtn = document.getElementById('s2Mtn');
  var s4MtnL = document.getElementById('s4MtnL');
  var s4MtnR = document.getElementById('s4MtnR');
  var s4Village = document.getElementById('s4Village');
  var s6MtnL = document.getElementById('s6MtnL');
  var s6MtnR = document.getElementById('s6MtnR');
  var particlesLayer = document.getElementById('particlesLayer');

  var timePill = document.getElementById('timePill');
  var stageChapter = document.getElementById('stageChapter');
  var shortsSubtitle = document.getElementById('shortsSubtitle');
  var btnVoice = document.getElementById('btnVoice');
  var btnPlayPause = document.getElementById('btnPlayPause');
  var btnReplay = document.getElementById('btnReplay');
  var progressTrack = document.getElementById('progressTrack');
  var progressFill = document.getElementById('progressFill');

  var quizOpts = document.querySelectorAll('.quiz-opt');
  var quizResult = document.getElementById('quizResult');

  var elapsed = 0;
  var playing = true;
  var voiceEnabled = true;
  var lastTime = performance.now();
  var activeSlideIdx = -1;
  var activeBeatIdx = -1;
  var koVoice = null;

  function pickKoreanVoice() {
    if (!('speechSynthesis' in window)) return;
    var voices = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('ko') === 0) {
        koVoice = voices[i];
        break;
      }
    }
  }

  if ('speechSynthesis' in window) {
    pickKoreanVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = pickKoreanVoice;
    }
  }

  function stopNarration() {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  }

  function speakLine(text) {
    if (!voiceEnabled || !playing || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.96;
      u.pitch = 1.02;
      if (koVoice) u.voice = koVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function formatSec(sec) {
    var s = Math.min(Math.floor(sec), Math.floor(DURATION));
    return '00:' + (s < 10 ? '0' + s : String(s));
  }

  function updateVisuals(t) {
    var pct = Math.min(100, Math.max(0, (t / DURATION) * 100));
    progressFill.style.width = pct.toFixed(2) + '%';
    progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
    timePill.textContent = formatSec(t) + ' / ' + formatSec(DURATION);

    var currentBeat = BEATS[0];
    var beatIdx = 0;
    for (var i = 0; i < BEATS.length; i++) {
      if (t >= BEATS[i].start && t < BEATS[i].end) {
        currentBeat = BEATS[i];
        beatIdx = i;
        break;
      }
    }

    stageChapter.textContent = currentBeat.chapter;
    shortsSubtitle.textContent = currentBeat.subtitle;

    if (activeBeatIdx !== beatIdx) {
      activeBeatIdx = beatIdx;
      speakLine(currentBeat.subtitle);
    }

    if (activeSlideIdx !== currentBeat.slide) {
      activeSlideIdx = currentBeat.slide;
      slides.forEach(function (el, idx) {
        el.classList.toggle('active', idx === activeSlideIdx);
      });
    }

    // Scene 1 (0~6s): Giant mountains slowly loom forward/upward
    if (currentBeat.slide === 0) {
      var p0 = Math.min(1, t / 6);
      s0MtnL.style.transform = 'translate3d(' + (p0 * 8).toFixed(1) + 'px, ' + (-p0 * 14).toFixed(1) + 'px, 0) scale(' + (1 + p0 * 0.04).toFixed(3) + ')';
      s0MtnR.style.transform = 'translate3d(' + (-p0 * 8).toFixed(1) + 'px, ' + (-p0 * 14).toFixed(1) + 'px, 0) scale(' + (1 + p0 * 0.04).toFixed(3) + ')';
    }

    // Scene 2 (6~12s): Outside the open hanok window, sky & mountain drift past each other
    if (currentBeat.slide === 1) {
      var p1 = Math.min(1, (t - 6) / 6);
      s2Sky.style.transform = 'translateX(' + (16 - p1 * 24).toFixed(1) + 'px) scale(1.12)';
      s2Mtn.style.transform = 'translate(' + (115 - p1 * 38).toFixed(1) + 'px, 26px) scale(0.66)';
    }

    // Scene 5-6 (24~36s): 6-layer diorama where mountains gradually sink as Ugong digs
    if (currentBeat.slide === 4) {
      var p4 = Math.min(1, Math.max(0, (t - 24) / 12));
      var eased4 = p4 * p4 * (3 - 2 * p4);
      var dropY = (eased4 * 145).toFixed(1);
      s4MtnL.style.transform = 'translateY(' + dropY + 'px)';
      s4MtnR.style.transform = 'translateY(' + dropY + 'px)';
      var digBob = playing ? Math.abs(Math.sin(t * 3.6)) * -3.5 : 0;
      s4Village.style.transform = 'translateY(' + digBob.toFixed(2) + 'px)';
    }

    // Scene 8 (42~48s): Two mountains physically slide apart left & right, revealing the sunny road!
    if (currentBeat.slide === 6) {
      var p6 = Math.min(1, Math.max(0, (t - 42) / 3.5));
      var eased6 = p6 * p6 * (3 - 2 * p6);
      s6MtnL.style.transform = 'translateX(' + (-eased6 * 420).toFixed(1) + 'px)';
      s6MtnR.style.transform = 'translateX(' + (eased6 * 420).toFixed(1) + 'px)';
    }

    particlesLayer.classList.toggle('blossoms', t >= 42);
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

  if (btnVoice) {
    btnVoice.addEventListener('click', function () {
      voiceEnabled = !voiceEnabled;
      btnVoice.setAttribute('aria-pressed', String(voiceEnabled));
      btnVoice.textContent = voiceEnabled ? '🔊 내레이션 켜짐' : '🔇 내레이션 꺼짐';
      if (!voiceEnabled) {
        stopNarration();
      } else if (playing && activeBeatIdx >= 0 && BEATS[activeBeatIdx]) {
        speakLine(BEATS[activeBeatIdx].subtitle);
      }
    });
  }

  btnPlayPause.addEventListener('click', function () {
    if (elapsed >= DURATION) {
      elapsed = 0;
      activeBeatIdx = -1;
      playing = true;
      btnPlayPause.textContent = '⏸️ 일시정지';
      updateVisuals(0);
      return;
    }
    playing = !playing;
    btnPlayPause.textContent = playing ? '⏸️ 일시정지' : '▶️ 재생';
    if (!playing) {
      stopNarration();
    } else if (activeBeatIdx >= 0 && BEATS[activeBeatIdx]) {
      speakLine(BEATS[activeBeatIdx].subtitle);
    }
  });

  btnReplay.addEventListener('click', function () {
    elapsed = 0;
    activeBeatIdx = -1;
    playing = true;
    btnPlayPause.textContent = '⏸️ 일시정지';
    updateVisuals(0);
  });

  progressTrack.addEventListener('click', function (e) {
    var rect = progressTrack.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    elapsed = ratio * DURATION;
    activeBeatIdx = -1;
    updateVisuals(elapsed);
  });

  window.addEventListener('beforeunload', stopNarration);

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
