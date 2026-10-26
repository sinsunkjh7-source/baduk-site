/* ============================================================
   게임 공통 설정 — 바탕(테마) + 음량
   사용: BkGameSettings.init({ host: '.board-area', target: '.board-area' })
   ============================================================ */
(function () {
  var THEMES = [
    { id: 'base', label: '기본' },
    { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' },
    { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' },
    { id: '7', label: '7' }
  ];

  function applyTheme(target, id) {
    if (!target) return;
    if (id === 'base') {
      target.style.backgroundImage = 'none';
      target.style.backgroundColor = '#EEF6E6';
    } else if (id === '6') {
      target.style.backgroundImage = 'none';
      target.style.backgroundColor = '#0b1430';
    } else if (id === '7') {
      target.style.backgroundImage = 'none';
      target.style.backgroundColor = '#cfe9fa';
    } else {
      target.style.backgroundColor = '#EEF6E6';
      target.style.backgroundImage = "url('../../images/bg_theme_" + id + ".jpg')";
    }
    target.style.backgroundSize = 'cover';
    target.style.backgroundPosition = 'center';
    target.style.backgroundRepeat = 'no-repeat';
    try { localStorage.setItem('bk_game_theme', id); } catch (e) {}
  }

  window.BkGameSettings = {
    init: function (opt) {
      opt = opt || {};
      var host = document.querySelector(opt.host || '.board-area');
      var target = document.querySelector(opt.target || '.board-area');
      if (!host) return;

      var css = document.createElement('style');
      css.textContent =
        '.bks-set-btn{position:absolute;top:10px;right:10px;left:auto;z-index:60;display:flex;align-items:center;gap:6px;' +
          'padding:8px 12px;border-radius:10px;border:1.5px solid #D3E6C4;background:#fff;color:#33682a;' +
          'font-family:inherit;font-size:13px;font-weight:800;cursor:pointer}' +
        '.bks-set-panel{position:absolute;top:52px;right:10px;z-index:70;width:232px;padding:14px;' +
          'background:#fff;border-radius:14px;box-shadow:0 12px 30px rgba(40,70,25,.22);border:2px solid #E8F1DE}' +
        '.bks-set-panel h4{margin:0 0 8px;font-size:13px;color:#2f4a25}' +
        '.bks-set-row{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}' +
        '.bks-chip{min-width:30px;padding:6px 9px;border:1.5px solid #DCEBCE;border-radius:8px;background:#F6FBF0;' +
          'color:#3B5B31;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer}' +
        '.bks-chip.-on{background:#5FA34C;border-color:#4A8A3A;color:#fff}' +
        '.bks-set-panel label{display:block;font-size:12px;color:#4a5a41;font-weight:700;margin:6px 0 4px}' +
        '.bks-set-panel input[type=range]{width:100%}';
      document.head.appendChild(css);

      if (!host.style.position || host.style.position === 'static') host.style.position = 'relative';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bks-set-btn';
      btn.innerHTML = '⚙ 설정';
      host.appendChild(btn);

      var panel = document.createElement('div');
      panel.className = 'bks-set-panel';
      panel.hidden = true;
      panel.innerHTML =
        '<h4>바탕</h4><div class="bks-set-row" id="bksThemes"></div>' +
        '<label>음량</label><input type="range" min="0" max="100" step="5" id="bksVol">';
      host.appendChild(panel);

      var row = panel.querySelector('#bksThemes');
      var saved = 'base';
      try { saved = localStorage.getItem('bk_game_theme') || 'base'; } catch (e) {}

      THEMES.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bks-chip' + (t.id === saved ? ' -on' : '');
        b.textContent = t.label;
        b.addEventListener('click', function () {
          row.querySelectorAll('.bks-chip').forEach(function (c) { c.classList.remove('-on'); });
          b.classList.add('-on');
          applyTheme(target, t.id);
        });
        row.appendChild(b);
      });

      /* 검증용: ?theme=N 으로 열면 해당 테마 적용 */
      var m = /[?&]theme=(\d|base)/.exec(location.search);
      var param = m ? m[1] : null;
      applyTheme(target, param || saved);
      if (param) {
        row.querySelectorAll('.bks-chip').forEach(function (c) {
          c.classList.toggle('-on', c.textContent === (param === 'base' ? '기본' : param));
        });
      }

      var vol = panel.querySelector('#bksVol');
      var v = 100;
      try { v = parseInt(localStorage.getItem('bk_game_volume') || '100', 10); } catch (e) {}
      vol.value = v;
      vol.addEventListener('input', function () {
        try { localStorage.setItem('bk_game_volume', vol.value); } catch (e) {}
        if (window.badukAudio && window.badukAudio.setVolume) {
          window.badukAudio.setVolume(parseInt(vol.value, 10) / 100);
        }
      });

      btn.addEventListener('click', function () { panel.hidden = !panel.hidden; });
    }
  };
})();
