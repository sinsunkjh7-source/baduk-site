/* ============================================================
   게임 바탕·음량 연동
   - 게임 안에 자체 설정 버튼을 만들지 않는다 (상단 ⚙ 설정 하나만 사용)
   - 상단 설정이 보내는 { bkSetting } 메시지를 받아 적용
   ============================================================ */
(function () {
  function applyTheme(target, id) {
    if (!target) return;
    id = String(id == null ? 'base' : id).replace('theme', '');
    if (id === 'base' || id === '') {
      target.style.backgroundImage = 'none';
      target.style.backgroundColor = '#EEF6E6';
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
      var target = document.querySelector(opt.target || '.wrap');
      if (!target) return;

      var saved = 'base';
      try { saved = localStorage.getItem('bk_game_theme') || 'base'; } catch (e) {}
      var m = /[?&]theme=(\d|base)/.exec(location.search);
      applyTheme(target, (m && m[1]) || saved);

      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || !d.bkSetting) return;

        if (d.kind === 'bg') {
          applyTheme(target, d.value);
        } else if (d.kind === 'volume') {
          try { localStorage.setItem('bk_game_volume', d.value); } catch (err) {}
          if (window.badukAudio && window.badukAudio.setVolume) {
            window.badukAudio.setVolume(parseInt(d.value, 10) / 100);
          }
        } else if (d.kind === 'sound') {
          try { localStorage.setItem('bk_game_sound', d.value); } catch (err) {}
          if (window.badukAudio && 'soundType' in window.badukAudio) {
            window.badukAudio.soundType = d.value;
          }
        }
      });
    }
  };
})();
