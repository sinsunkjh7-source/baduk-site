/* ============================================================
   상단 메인 메뉴 (바둑스쿨 자체)
   - 기본 메뉴는 지우지 않고 CSS로 숨긴다 (되돌리기 쉬움)
   - 5칸: 바둑 학습 · 대국 · 오목·알까기 · 이야기 · 강사 모드
   ============================================================ */
(function () {
  var TEACHER_PASS = '2580';       /* 임시 비밀번호 — 서버 인증 전까지 */
  var SESSION_KEY = 'bkTeacherOk';

  var MENU = [
    { key: 'learn', label: '바둑 학습', go: 'lessons' },
    { key: 'play', label: '대국', go: 'play' },
    {
      key: 'games', label: '<span class="bk-mainnav__fun"><svg class="bk-fun-burst" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12.00,0.60 14.65,6.50 20.91,4.89 17.95,10.64 23.11,14.54 16.77,15.80 16.95,22.27 12.00,18.10 7.05,22.27 7.23,15.80 0.89,14.54 6.05,10.64 3.09,4.89 9.35,6.50" fill="#FFD84D" stroke="#C62828" stroke-width="1.5" stroke-linejoin="round"/></svg><span class="bk-fun-text">Fun</span></span>', items: [
        { key: 'omok', label: '오목', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="1.5" y="1.5" width="21" height="21" rx="4.5" fill="#F2C87A"/><path d="M6.5 1.5v21M12 1.5v21M17.5 1.5v21M1.5 6.5h21M1.5 12h21M1.5 17.5h21" stroke="#B98540" stroke-width="1.1"/><circle cx="6.5" cy="17.5" r="3.1" fill="#242424"/><circle cx="12" cy="12" r="3.1" fill="#FFFFFF"/><circle cx="17.5" cy="6.5" r="3.1" fill="#242424"/></svg>' },
        { key: 'alkkagi', label: '알까기', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="8" cy="14" r="6" fill="#242424"/><circle cx="17.5" cy="10" r="6" fill="#FFFFFF" stroke="#D9D9D9" stroke-width=".8"/><path d="M3 3.5l2.6 2.6M20.5 20l-2.2-2.2M21 6.5l-2.4 1.2M3.5 18l2.4-1.2" stroke="#FFC93C" stroke-width="2" stroke-linecap="round"/></svg>' }
      ]
    },
    {
      key: 'story', label: '이야기', items: [
        { key: 'hanja', label: '바둑 한자', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4z"/><path d="M20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"/></svg>' },
        { key: 'saju', label: '고사성어', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>' },
        { key: 'gyeong-eon', label: '격언 한마디', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>' },
        { key: 'injung', label: '인성 스토리', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-7"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 16c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/></svg>' }
      ]
    },
    { key: 'teacher', label: '강사 모드', lock: true }
  ];

  function isTeacher() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; }
  }

  function build() {
    var nav = document.createElement('nav');
    nav.className = 'bk-mainnav';
    nav.setAttribute('aria-label', '주 메뉴');

    MENU.forEach(function (m) {
      var wrap = document.createElement('div');
      wrap.className = 'bk-mainnav__item' + (m.items ? ' -has-sub' : '');

      var btn = document.createElement(m.go ? 'a' : 'button');
      btn.className = 'bk-mainnav__link';
      if (m.go) {
        btn.href = '#';
        btn.dataset.go = m.go;
      } else {
        btn.type = 'button';
        btn.dataset.toggle = m.key;
      }
      btn.innerHTML = (m.lock ? '<span class="bk-mainnav__lock">🔒</span>' : '') + m.label;

      wrap.appendChild(btn);

      if (m.items) {
        var sub = document.createElement('div');
        sub.className = 'bk-mainnav__sub';
        m.items.forEach(function (it) {
          var a = document.createElement('button');
          a.type = 'button';
          a.className = 'bk-mainnav__sublink';
          a.dataset.sub = it.key;
          a.innerHTML = '<span class="bk-mainnav__ico">' + (it.icon || '·') + '</span><span>' + it.label + '</span>';
          sub.appendChild(a);
        });
        wrap.appendChild(sub);
      }
      nav.appendChild(wrap);
    });

    return nav;
  }

  /* ---------- 잠금 게이트 ---------- */
  function openGate() {
    if (document.getElementById('bk-gate')) return;
    var el = document.createElement('div');
    el.id = 'bk-gate';
    el.innerHTML =
      '<div class="bk-gate__box">' +
      '<h3>강사 모드</h3>' +
      '<p>선생님 전용 공간입니다.<br>비밀번호를 입력해주세요.</p>' +
      '<input class="bk-gate__input" type="password" inputmode="numeric" maxlength="12">' +
      '<div class="bk-gate__row">' +
      '<button class="bk-gate__cancel" type="button">취소</button>' +
      '<button class="bk-gate__ok" type="button">들어가기</button>' +
      '</div>' +
      '<p class="bk-gate__err" hidden>비밀번호가 맞지 않습니다.</p>' +
      '</div>';
    document.body.appendChild(el);

    var input = el.querySelector('.bk-gate__input');
    var err = el.querySelector('.bk-gate__err');
    setTimeout(function () { input.focus(); }, 60);

    function close() { el.remove(); }
    function submit() {
      if (input.value === TEACHER_PASS) {
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
        close();
        location.assign('teacher/index.html');
      } else {
        err.hidden = false; input.value = ''; input.focus();
      }
    }
    el.querySelector('.bk-gate__ok').addEventListener('click', submit);
    el.querySelector('.bk-gate__cancel').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- 앱 이동 ---------- */
  function enterApp(section) {
    if (window.badukApp && typeof window.badukApp.enterApp === 'function') {
      window.badukApp.enterApp(section);
      return true;
    }
    return false;
  }

  function toast(msg) {
    var t = document.getElementById('bk-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'bk-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('-show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.remove('-show'); }, 1800);
  }

  function notReady(name) { toast(name + ' 화면을 준비 중입니다'); }

  /* ---------- 이벤트 ---------- */
  function bind(nav) {
    nav.addEventListener('click', function (e) {
      var link = e.target.closest('.bk-mainnav__link');
      var sub = e.target.closest('.bk-mainnav__sublink');

      if (sub) {
        var k = sub.dataset.sub;
        if (k === 'omok') {
          nav.querySelectorAll('.bk-mainnav__item').forEach(function (w) { w.classList.remove('-open'); });
          if (window.bkGames) window.bkGames.open('omok', '오목');
          else notReady('오목');
          return;
        }
        if (k === 'alkkagi') {
          nav.querySelectorAll('.bk-mainnav__item').forEach(function (w) { w.classList.remove('-open'); });
          if (window.bkGames) window.bkGames.open('alkkagi', '알까기');
          else notReady('알까기');
          return;
        }
        else notReady(sub.textContent.trim());
        return;
      }

      if (!link) return;
      e.preventDefault();

      var go = link.dataset.go;
      var toggle = link.dataset.toggle;

      if (go === 'lessons') {
        if (window.bkGames) window.bkGames.open('appMissions', '바둑 학습');
        else if (!enterApp('lessons')) notReady('바둑 학습');
        return;
      }
      if (go === 'play') {
        if (window.bkGames) window.bkGames.open('appLecture', '대국');
        else if (!enterApp('play')) notReady('대국');
        return;
      }

      if (toggle === 'teacher') {
        if (isTeacher()) { location.assign('teacher/index.html'); } else openGate();
        return;
      }

      /* 드롭다운 열고 닫기 */
      var wrap = link.parentElement;
      var isOpen = wrap.classList.contains('-open');
      nav.querySelectorAll('.bk-mainnav__item').forEach(function (w) { w.classList.remove('-open'); });
      if (!isOpen) wrap.classList.add('-open');
    });


    /* 마우스를 올리면 바로 열림 (터치 기기는 클릭 사용) */
    var hoverTimer = null;
    nav.querySelectorAll('.bk-mainnav__item.-has-sub').forEach(function (wrap) {
      wrap.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          nav.querySelectorAll('.bk-mainnav__item').forEach(function (w) { w.classList.remove('-open'); });
          wrap.classList.add('-open');
        }, 90);
      });
      wrap.addEventListener('mouseleave', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { wrap.classList.remove('-open'); }, 160);
      });
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        nav.querySelectorAll('.bk-mainnav__item').forEach(function (w) { w.classList.remove('-open'); });
      }
    });
  }

  function mount() {
    var header = document.querySelector('.guest-toolbar-desktop');
    if (!header) return false;
    if (header.querySelector('.bk-mainnav')) return true;

    var nav = build();
    var original = header.querySelector('.guest-toolbar-desktop-navigation');
    if (original && original.parentNode) original.parentNode.insertBefore(nav, original);
    else header.appendChild(nav);

    header.classList.add('bk-mainnav-ready');
    bind(nav);
    return true;
  }

  function init() {
    if (mount()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (mount() || ++tries > 40) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
