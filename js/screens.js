/* ============================================================
   화면 전환 (한 문서 안에서 홈 ↔ 학습·대국)
   - 원본 홈(#landingPage)은 그대로 두고 숨기기만 한다
   - 앱 화면(#bksApp)을 보여준다
   ============================================================ */
(function () {
  function appEl() { return document.getElementById('bksApp'); }
  function homeEl() { return document.getElementById('landingPage'); }

  var cssLoaded = false;
  function loadAppCss() {
    if (cssLoaded) return;
    cssLoaded = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'app_src/style.css?v=1';
    l.id = 'bksAppCss';
    document.head.appendChild(l);
  }

  function showScreen(name) {
    var app = appEl(), home = homeEl();
    var toApp = name && name !== 'home';

    if (home) home.style.display = toApp ? 'none' : '';
    if (app) app.hidden = !toApp;
    document.documentElement.classList.toggle('bk-screen', !!toApp);
    window.scrollTo(0, 0);

    if (toApp) {
      loadAppCss();
      var a = window.badukApp;
      if (a && a.switchMode) {
        try { a.switchMode(name); } catch (e) { console.warn(e); }
      }
    }
  }
  window.bkShowScreen = showScreen;

  /* 학습·대국 메뉴가 부르는 진입점 (원본 mainnav / game_frame 대체) */
  var MAP = {
    appMissions: 'missions',
    appLecture: 'online',
    missions: 'missions',
    online: 'online',
    lecture: 'lecture'
  };

  function open(key) {
    if (key === 'omok') { location.href = 'games/omok/index.html'; return; }
    if (key === 'alkkagi') { location.href = 'games/alkkagi/index.html'; return; }
    if (key === 'play') { location.href = 'games/play/index.html'; return; }
    var mode = MAP[key];
    if (!mode) { alert('준비 중입니다'); return; }
    showScreen(mode);
  }

  /* game_frame.js 가 먼저 정의한 bkGames 를 덮어쓴다 (스크립트 마지막에 로드) */
  window.bkGames = { open: open };
  window.bkOpenScreen = open;

  /* 원본 홈 버튼(onclick=badukApp.enterApp)이 iframe 대신 화면 전환을 쓰도록 교체 */
  function patchEnterApp() {
    var a = window.badukApp;
    if (!a || a.__bkPatched) return;
    var orig = a.enterApp;

    if (!orig) {
      /* 원본 앱에 없던 진입 함수 — 홈 버튼이 부르는 이름 */
      a.enterApp = function (sec) {
        var map = { lessons: 'missions', learn: 'missions', puzzles: 'missions', play: 'online', bots: 'online' };
        var mode = map[sec];
        if (mode) { showScreen(mode); return; }
        alert('준비 중입니다');
      };
      a.__bkPatched = true;
      return;
    }

    a.enterApp = function (sec) {
      var map = { lessons: 'missions', learn: 'missions', puzzles: 'missions', play: 'online', bots: 'online' };
      var mode = map[sec];
      if (mode) { showScreen(mode); return; }
      return orig.apply(a, arguments);
    };
    a.__bkPatched = true;
  }
  window.bkPatchEnterApp = patchEnterApp;
  setInterval(patchEnterApp, 400);

  /* 홈으로 돌아가기 (앱 좌측 상단 홈 버튼) */
  window.bkHomeScreen = function () { showScreen('home'); };

  /* 앱의 '홈' 버튼도 같은 문서에서 홈으로 */
  function patchHomeButton() {
    window.showMainPortal = function () { showScreen('home'); };
    if (window.badukApp) window.badukApp.showMainPortal = window.showMainPortal;
  }
  patchHomeButton();
  setInterval(patchHomeButton, 700);

  /* 진입 분기: ?screen=missions 같은 직접 링크 */
  var m = /[?&]screen=([a-z]+)/.exec(location.search);
  if (m) document.addEventListener('DOMContentLoaded', function () { showScreen(m[1]); });
})();
