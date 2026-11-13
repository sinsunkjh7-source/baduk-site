/**
 * 개로왕과 도림 (蓋鹵王과 道琳) — 표준 종이 극장 앱 엔트리
 */
(function () {
  'use strict';

  function init() {
    var container = document.getElementById('paperTheaterApp');
    if (!container || !window.PaperTheaterEngine || !window.STORY_GAERO) {
      return;
    }

    window.paperTheater = new window.PaperTheaterEngine({
      container: container,
      story: window.STORY_GAERO,
      autoPlay: false,
      voiceEnabled: true,
      onEnded: function () {
        console.log('[PaperTheater] Gaero & Dorim story ended.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
