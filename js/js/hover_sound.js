/* ============================================================
   사이드바 메뉴 호버 사운드
   - 메뉴 항목에 마우스가 '새로' 닿을 때만 소리
   - 같은 항목 안에서 움직이면 다시 울리지 않음
   - 너무 자주 울리지 않게 최소 간격 제한
   ============================================================ */
(function () {
  var SEL = [
    /* 사이드바 */
    '.ck-sidebar .ck-subnav-link',
    '.ck-sidebar .ck-sb-nav a',
    '.ck-sidebar .ck-sb-nav button',
    '.ck-sidebar .ck-sb-item',
    '.ck-sidebar .ck-sb-link',
    '.ck-sidebar .ck-nav-item',
    /* 상단 바 */
    '.guest-toolbar-desktop a',
    '.guest-toolbar-desktop button',
    '.guest-toolbar-desktop .bk-hbtn',
    '.guest-toolbar-desktop .bk-avatar',
    '.guest-toolbar-desktop .guest-toolbar-popup-menu__item-link',
    '.guest-toolbar-desktop .guest-toolbar-popup-menu__link',
    '.guest-toolbar-desktop .guest-toolbar-popup-menu > span',
    /* 앱 중앙: 탭·필·카드 */
    '.ck-app-shell .ck-pill-btn',
    '.ck-app-shell .ck-pill-tabs button',
    '.ck-app-shell .ck-play-card',
    '.ck-app-shell .ck-card',
    '.ck-app-shell .ck-coach-card',
    '.ck-app-shell button',
    '.ck-app-shell a[href]',
    /* 홈 중앙 버튼 */
    '.ck-landing-wrapper .bk-btn',
    '.ck-landing-wrapper button'
  ].join(',');

  /* 소리를 내면 안 되는 영역 (설정 패널·아바타 메뉴) */
  var EXCLUDE = '.bk-sound, .bk-avatar-menu, .bk-gate';

  /* 카드 안에서는 카드 하나를 단위로 소리를 낸다.
     (카드 안의 제목·버튼까지 각각 울리면 한 카드에서 소리가 여러 번 난다) */
  var CARD_SCOPE = '.ck-play-card, .ck-card, .ck-coach-card, .ck-central-avatar-card';

  var MIN_GAP = 90;   /* ms */
  var lastTime = 0;
  var lastEl = null;

  function tick(el) {
    if (el === lastEl) return;
    lastEl = el;
    var now = Date.now();
    if (now - lastTime < MIN_GAP) return;
    lastTime = now;
    if (window.badukAudio && typeof window.badukAudio.playHover === 'function') {
      window.badukAudio.playHover();
    }
  }

  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest(SEL);
    if (!el) return;
    if (el.closest(EXCLUDE)) return;
    /* 카드 내부 요소 → 카드 하나로 정규화 (한 카드 = 한 소리) */
    var card = el.closest(CARD_SCOPE);
    if (card) el = card;
    if (!el.getBoundingClientRect().width) return;   /* 숨은 항목 제외 */
    tick(el);
  }, true);

  /* 사이드바 밖으로 나가면 초기화 → 다시 들어올 때 울림 */
  document.addEventListener('mouseout', function (e) {
    var el = e.target.closest(SEL);
    if (el && !el.contains(e.relatedTarget)) lastEl = null;
  }, true);
})();
