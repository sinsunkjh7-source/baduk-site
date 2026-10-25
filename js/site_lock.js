/* ============================================================
   사이트 잠금 (선생님 인증)
   - 비밀번호는 SHA-256 해시로만 저장 (평문 노출 없음)
   - 인증하면 이 브라우저 세션 동안 유지
   - 비밀번호 변경: 아래 PASS_HASH 값만 교체
   ============================================================ */
(function () {
  var PASS_HASH = 'a02947deb404345ac2c69d38061e53a71123ad7a81c1099e7714966d7e2f41c0'; /* 5840 */
  var KEY = 'bk_unlocked';

  function unlocked() {
    try {
      var v = sessionStorage.getItem(KEY);
      if (!v) return false;
      return (Date.now() - parseInt(v, 10)) < 1000 * 60 * 60 * 12; /* 12시간 */
    } catch (e) { return false; }
  }

  function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
        .then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) {
            return ('00' + b.toString(16)).slice(-2);
          }).join('');
        });
    }
    return Promise.resolve(null);
  }

  function build() {
    var el = document.createElement('div');
    el.className = 'bk-lock';
    el.innerHTML =
      '<div class="bk-lock__box">' +
        '<div class="bk-lock__logo">바둑스쿨</div>' +
        '<h2>선생님 인증</h2>' +
        '<p>비밀번호 4자리를 입력해 주세요.</p>' +
        '<div class="bk-lock__input-wrap">' +
          '<input class="bk-lock__input" type="password" inputmode="numeric" maxlength="8" autocomplete="off">' +
        '</div>' +
        '<button class="bk-lock__ok" type="button">들어가기</button>' +
        '<p class="bk-lock__err" hidden>비밀번호가 맞지 않습니다.</p>' +
        '<p class="bk-lock__note">🔒 선생님 전용 보안 세션</p>' +
      '</div>';
    return el;
  }

  function mount() {
    if (unlocked()) return;

    var el = build();
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(el);

    var input = el.querySelector('.bk-lock__input');
    var err = el.querySelector('.bk-lock__err');
    var ok = el.querySelector('.bk-lock__ok');
    setTimeout(function () { input.focus(); }, 80);

    function submit() {
      var pw = input.value.trim();
      if (!pw) return;
      sha256(pw).then(function (hash) {
        if (hash === PASS_HASH) {
          try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) {}
          document.documentElement.style.overflow = '';
          el.remove();
        } else {
          err.hidden = false;
          input.value = '';
          input.focus();
        }
      });
    }

    ok.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
