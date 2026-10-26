/* 게임 페이지에서 홈으로 돌아가는 버튼 (충돌 없는 독립 스타일) */
(function () {
  function add() {
    if (document.getElementById('bksHomeBtn')) return;
    var a = document.createElement('a');
    a.id = 'bksHomeBtn';
    a.href = '/';
    a.textContent = '🏠 홈';
    a.setAttribute('aria-label', '홈으로');
    a.style.cssText = [
      'position:fixed', 'top:64px', 'left:16px', 'z-index:99999',
      'display:inline-flex', 'align-items:center', 'gap:6px',
      'padding:9px 16px', 'border-radius:999px',
      'background:#4A8A3A', 'color:#fff', 'font-size:15px', 'font-weight:800',
      'font-family:inherit', 'text-decoration:none',
      'box-shadow:0 6px 16px rgba(0,0,0,.22)', 'line-height:1'
    ].join(';');
    a.addEventListener('mouseenter', function () { a.style.background = '#3d7a33'; });
    a.addEventListener('mouseleave', function () { a.style.background = '#4A8A3A'; });
    document.body.appendChild(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
