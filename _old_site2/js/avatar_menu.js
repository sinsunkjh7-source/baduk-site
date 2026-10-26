/* ============================================================
   상단 바 아바타 메뉴
   - 아바타 클릭 → 드롭다운 (아바타 꾸미기)
   - 아바타 꾸미기 → 앱의 아바타 화면(enterApp('avatar'))으로 이동
   ============================================================ */
(function () {
  var wrap = document.querySelector('.bk-avatar-wrap');
  if (!wrap) return;
  var btn = wrap.querySelector('.bk-avatar');
  var menu = wrap.querySelector('.bk-avatar-menu');

  function open() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });

  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  menu.addEventListener('click', function (e) {
    var item = e.target.closest('[data-bk-go]');
    if (!item) return;
    close();
    var target = item.getAttribute('data-bk-go');
    if (window.badukApp && typeof window.badukApp.enterApp === 'function') {
      window.badukApp.enterApp(target);
    }
  });
})();
