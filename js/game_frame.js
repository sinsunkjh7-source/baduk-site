/* ============================================================
   게임 화면 띄우기 (오목 등) — 전체 화면 오버레이 + iframe
   사용: window.bkGames.open('omok', '오목')
   ============================================================ */
(function () {
  var GAMES = {
    omok: { path: 'games/omok/index.html', title: '오목' },
    alkkagi: { path: 'games/alkkagi/index.html', title: '알까기' },
    play: { path: 'games/play/index.html', title: '대국' },
    learn: { path: 'games/learn/index.html', title: '바둑 학습' },
    appMissions: { path: 'app/index.html?mode=missions&embed=1', title: '바둑 학습' },
    appLecture: { path: 'app/index.html?mode=online&embed=1', title: '대국' }
  };

  var el = null;
  var frame = null;

  function close() {
    if (!el) return;
    el.remove();
    el = null;
    frame = null;
    document.body.style.overflow = '';
  }

  function open(key, titleOverride) {
    var g = GAMES[key];
    if (!g) return false;

    if (el) close();

    el = document.createElement('div');
    el.className = 'bk-game-overlay';
    el.innerHTML =
      '<div class="bk-game-bar">' +
        '<img class="bk-game-logo" src="images/baduk_header_logo.png" alt="바둑스쿨">' +
        '<button class="bk-game-back" type="button">← 돌아가기</button>' +
        '<nav class="bk-game-nav">' +
          '<button type="button" data-key="appMissions">바둑 학습</button>' +
          '<button type="button" data-key="appLecture">대국</button>' +
          '<button type="button" data-key="omok">오목</button>' +
          '<button type="button" data-key="alkkagi">알까기</button>' +
        '</nav>' +
        '<span class="bk-game-spacer"></span>' +
        '<button class="bk-game-sound" type="button">⚙ 설정</button>' +
      '</div>' +
      '<iframe class="bk-game-frame" src="' + g.path + '" title="' + g.title + '" allow="autoplay"></iframe>';

    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    frame = el.querySelector('.bk-game-frame');

    el.querySelector('.bk-game-back').addEventListener('click', close);

    /* 화면 안에서 바로 다른 화면으로 전환 */
    function setActive(key) {
      el.querySelectorAll('.bk-game-nav button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.key === key);
      });
    }
    setActive(key);
    el.querySelectorAll('.bk-game-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.key;
        if (!GAMES[k]) return;
        frame.src = GAMES[k].path;
        setActive(k);
      });
    });

    /* ---- 소리 설정 (사이트 설정과 같은 값 공유) ---- */
    var TYPES = [['classic', '명품'], ['deep', '묵직'], ['crisp', '경쾌'], ['pop', '퐁퐁']];
    var panel = document.createElement('div');
    panel.className = 'bk-sound bk-sound--game';
    panel.innerHTML =
      '<div class="bk-sound__head">설정</div>' +
      '<div class="bk-sound__row bk-sound__row--chips">' +
        '<span class="bk-sound__label">바둑판</span>' +
        [9, 13, 19].map(function (n) {
          return '<button type="button" class="bk-chip" data-kind="size" data-val="' + n + '">' + n + '줄</button>';
        }).join('') +
      '</div>' +
      '<div class="bk-sound__row bk-sound__row--chips">' +
        '<span class="bk-sound__label">바탕</span>' +
        [1, 2, 3, 4, 5, 6, 7].map(function (n) {
          return '<button type="button" class="bk-chip" data-kind="bg" data-val="theme' + n + '">' + n + '</button>';
        }).join('') +
      '</div>' +
      '<div class="bk-sound__row bk-sound__row--chips">' +
        '<span class="bk-sound__label">판</span>' +
        [['wood', '나무'], ['green', '잔디'], ['sky', '하늘']].map(function (t) {
          return '<button type="button" class="bk-chip" data-kind="skin" data-val="' + t[0] + '">' + t[1] + '</button>';
        }).join('') +
      '</div>' +
      '<div class="bk-sound__row bk-sound__row--chips">' +
        '<span class="bk-sound__label">바둑돌</span>' +
        [1, 2, 3, 4, 5, 6, 7].map(function (n) {
          return '<button type="button" class="bk-chip" data-kind="stone" data-val="S' + n + '">' + n + '</button>';
        }).join('') +
      '</div>' +
      '<div class="bk-sound__row">' +
        '<span class="bk-sound__label">음량</span>' +
        '<input class="bk-sound__range" type="range" min="0" max="200" step="5" value="100">' +
        '<span class="bk-sound__val">100%</span>' +
      '</div>' +
      '<div class="bk-sound__row bk-sound__row--btns">' +
        '<span class="bk-sound__label">효과음</span>' +
        TYPES.map(function (t) {
          return '<button type="button" class="bk-sound__type" data-sound="' + t[0] + '">' + t[1] + '</button>';
        }).join('') +
      '</div>' +
      '<button type="button" class="bk-sound__mute">🔊 소리 켜짐</button>';
    el.appendChild(panel);

    var range = panel.querySelector('.bk-sound__range');
    var valEl = panel.querySelector('.bk-sound__val');
    var mute = panel.querySelector('.bk-sound__mute');
    var typeBtns = panel.querySelectorAll('.bk-sound__type');

    /* 앱 옵션(판 크기·바탕·판 스킨·바둑돌) 전달 */
    var STYLES = ['classic', 'crystal', 'galaxy', 'adventurer', 'cat', 'gem-sapphire', 'gem-ruby'];
    panel.querySelectorAll('.bk-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.dataset.kind, val = chip.dataset.val;
        if (kind === 'stone') val = STYLES[parseInt(val.slice(1), 10) - 1] || 'classic';
        var group = panel.querySelectorAll('.bk-chip[data-kind="' + kind + '"]');
        group.forEach(function (c) { c.classList.remove('-on'); });
        chip.classList.add('-on');
        if (frame && frame.contentWindow) {
          try { frame.contentWindow.postMessage({ bkSetting: true, kind: kind, value: val }, '*'); } catch (e) {}
        }
      });
    });

    function sync() {
      var a = window.badukAudio;
      var vol = a ? Math.round(a.volume * 100) : 100;
      range.value = vol;
      valEl.textContent = vol + '%';
      var on = a ? a.enabled : true;
      mute.textContent = on ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      mute.classList.toggle('-off', !on);
      if (a && a.soundType) {
        typeBtns.forEach(function (b) { b.classList.toggle('-on', b.dataset.sound === a.soundType); });
      }
    }

    function broadcast() {
      var a = window.badukAudio;
      var payload = {
        type: 'bk:audio',
        volume: a ? Math.round(a.volume * 100) : 100,
        enabled: a ? a.enabled : true,
        soundType: a ? a.soundType : 'classic'
      };
      if (frame && frame.contentWindow) {
        try { frame.contentWindow.postMessage(payload, '*'); } catch (e) {}
      }
    }

    el.querySelector('.bk-game-sound').addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('-show');
      sync();
    });

    range.addEventListener('input', function () {
      valEl.textContent = range.value + '%';
      if (window.badukAudio) window.badukAudio.setVolume(parseInt(range.value, 10) / 100);
      broadcast();
    });

    mute.addEventListener('click', function () {
      if (window.badukAudio) window.badukAudio.toggle();
      sync(); broadcast();
    });

    typeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.badukAudio) window.badukAudio.setSoundType(btn.dataset.sound);
        sync(); broadcast();
        if (window.badukAudio) window.badukAudio.playStone();
      });
    });

    frame.addEventListener('load', function () { setTimeout(broadcast, 60); });
    setTimeout(broadcast, 200);

    return true;
  }

  /* 게임 안에서 보내는 닫기 신호 */
  window.addEventListener('message', function (e) {
    if (e && e.data === 'bk:omok-close') close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && el) close();
  });

  /* 앱 안에서 로고·홈을 누르면 사이트 홈으로 복귀 */
  window.addEventListener('message', function (e) {
    if (e && e.data === 'bk:close') close();
  });

  /* 주소 뒤 #키 로 바로 열기 (예: /#appMissions) */
  if (location.hash) {
    var hk = location.hash.replace('#', '');
    if (GAMES[hk]) setTimeout(function () { open(hk); }, 250);
  }

  window.bkGames = { open: open, close: close };
})();
