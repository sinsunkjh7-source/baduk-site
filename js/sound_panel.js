/* ============================================================
   소리 설정 패널 (사이드바 ⚙ 버튼)
   - 음량 슬라이더 (0~150%)
   - 음소거 토글
   - 착수 효과음 4종 선택 + 미리듣기
   기존 baduk 사이트의 audio.js 설정을 그대로 사용
   ============================================================ */
(function () {
  function gearButton() {
    var btns = [].slice.call(document.querySelectorAll('.ck-sidebar .ck-sb-mini-icon-btn'));
    return btns.filter(function (b) { return !b.classList.contains('ck-badge-btn'); }).pop();
  }

  var TYPES = [
    ['classic', '명품'],
    ['deep', '묵직'],
    ['crisp', '경쾌'],
    ['pop', '퐁퐁']
  ];

  function build() {
    var el = document.createElement('div');
    el.className = 'bk-sound';
    el.innerHTML =
      '<div class="bk-sound__head">소리 설정</div>' +
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
    return el;
  }

  function mount() {
    var gear = gearButton();
    if (!gear || document.querySelector('.bk-sound')) return false;

    var panel = build();
    document.body.appendChild(panel);

    var range = panel.querySelector('.bk-sound__range');
    var val = panel.querySelector('.bk-sound__val');
    var mute = panel.querySelector('.bk-sound__mute');
    var types = panel.querySelectorAll('.bk-sound__type');

    function sync() {
      var a = window.badukAudio;
      if (!a) return;
      range.value = Math.round(a.volume * 100);
      val.textContent = range.value + '%';
      mute.textContent = a.enabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      mute.classList.toggle('-off', !a.enabled);
      types.forEach(function (b) {
        b.classList.toggle('active', b.dataset.sound === a.soundType);
      });
    }

    range.addEventListener('input', function () {
      if (!window.badukAudio) return;
      window.badukAudio.setVolume(parseInt(range.value, 10) / 100);
      val.textContent = range.value + '%';
    });
    range.addEventListener('change', function () {
      if (window.badukAudio) window.badukAudio.playStone();
    });
    mute.addEventListener('click', function () {
      if (!window.badukAudio) return;
      window.badukAudio.toggle();
      sync();
    });
    types.forEach(function (b) {
      b.addEventListener('click', function () {
        if (!window.badukAudio) return;
        window.badukAudio.setSoundType(b.dataset.sound);
        sync();
        window.badukAudio.playStone();
      });
    });

    function place() {
      var r = gear.getBoundingClientRect();
      var sb = document.querySelector('.ck-sidebar');
      var right = sb ? sb.getBoundingClientRect().right : 290;
      panel.style.left = Math.round(right + 12) + 'px';
      panel.style.top = Math.round(r.top - 8) + 'px';
    }

    function open() {
      panel.classList.add('-show');
      sync();
      place();
    }
    function close() { panel.classList.remove('-show'); }

    gear.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.contains('-show') ? close() : open();
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
      if (panel.classList.contains('-show')) place();
    });

    sync();
    return true;
  }

  if (!mount()) {
    var mo = new MutationObserver(function () {
      if (mount()) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mount(); }, 1500);
  }
})();
